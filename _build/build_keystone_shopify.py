#!/usr/bin/env python3
"""_build/shopify/page.keystone.liquid: the Keystone spiral as a page of mlow.nyc, ordering prints in place.

keystone.html is the source. This turns a copy of it into a Shopify page template (layout none, the
whole page wrapped in raw so Liquid never reads the JavaScript):

  - <base href="https://n3wyorkers.com/"> makes every relative asset (Three.js, the wall images, all
    671 states, the loops) load from the site, which serves them with Access-Control-Allow-Origin: *.
    Shopify calls therefore never use a relative path: they use location.origin, which is the store.
  - video states get crossOrigin anonymous, or WebGL refuses a cross origin VideoTexture
  - the site's print switch scripts and the mint bar are dropped; the card's Order a print opens a panel
    that reads the piece's listing (/products/<handle>.js), offers size and surface with the sizes turned
    to the painting's orientation and the exact fits marked, and adds the variant to the real cart with
    Orientation and Fit as line item properties for the lab. A cart pill reads /cart.js.

Handles and aspect ratios come from _build/api/keystone_prints.json and the K111 list in the page.
Upload the result to the theme as templates/page.keystone.liquid; the page keystone-111 uses it.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
SRC = os.path.join(SITE, "keystone.html")
OUT = os.path.join(HERE, "shopify", "page.keystone.liquid")

s = open(SRC, encoding="utf-8").read()
K = json.load(open(os.path.join(HERE, "api", "keystone_prints.json"), encoding="utf-8"))
k111 = json.loads(re.search(r"var K111 = (\[.*?\]);\n</script>", s, re.S).group(1))
ar = {p["n"]: p.get("ar", 1.5) for p in k111}
SHOPMAP = {str(p["n"]): {"h": p["handle"], "ar": ar.get(p["n"], 1.5)} for p in K["pieces"]}

ORDER_CSS = """
  #kOrder{margin:4px 0 18px;padding:14px 14px 12px;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:10px;background:rgba(70,146,194,.06)}
  #kOrder label{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate);margin:0 0 5px}
  #kOrder select{width:100%;margin:0 0 10px;padding:9px 10px;border-radius:7px;border:1px solid rgba(255,255,255,.16);background:#0f1320;color:var(--cloud);font:14px/1.2 system-ui,sans-serif}
  #kOrder .orow{display:flex;align-items:center;justify-content:space-between;gap:10px}
  #kOrder .oprice{font-family:var(--mono);font-size:18px;color:var(--cloud)}
  #kOrder button{padding:10px 16px;border:0;border-radius:7px;background:var(--blue);color:#fff;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
  #kOrder button:disabled{opacity:.5;cursor:default}
  #kOrder .ofine{font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;color:var(--slate);margin-top:9px;line-height:1.5}
  #kOrder .ofine a{color:var(--blue-soft)}
  #shopbar{position:fixed;z-index:7;top:14px;left:50%;transform:translateX(-50%);display:flex;gap:8px}
  #shopbar a{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cloud);text-decoration:none;padding:8px 12px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,13,22,.55);backdrop-filter:blur(6px)}
  #shopbar a:hover{border-color:var(--blue)}
"""

ORDER_JS = r"""
<script>
/* Ordering on mlow.nyc. The page's <base> points at n3wyorkers.com for the art, so every store call
   is built on location.origin, never a relative path. */
var KSHOP = __SHOPMAP__, SHOP = location.origin;
function ksMoney(c){ return '$'+(c/100).toLocaleString('en-US',{maximumFractionDigits:0}); }
function ksCart(){ fetch(SHOP+'/cart.js',{headers:{Accept:'application/json'}}).then(function(r){return r.json();}).then(function(c){ var a=document.getElementById('cartPill'); if(a) a.textContent='Cart · '+c.item_count; }).catch(function(){}); }
/* "8 x 10 in" turned to the painting: a landscape painting is offered 10 x 8. Exact when the print's
   proportions match the painting's to within 3 percent; otherwise the whole image is printed with a
   border, never cropped. */
function ksSize(v, ar){ var m=(v||'').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i); if(!m) return {label:v, exact:false};
  var a=+m[1], b=+m[2], lo=Math.min(a,b), hi=Math.max(a,b), land=ar>1.03, port=ar<0.97;
  var w=land?hi:(port?lo:a), h=land?lo:(port?hi:b), r=Math.max(ar,1/ar), exact=Math.abs(hi/lo-r)/r<0.03;
  return {label:w+' x '+h+' in', exact:exact}; }
function ksOrient(ar){ return ar>1.03?'Landscape':(ar<0.97?'Portrait':'Square'); }
var KO = {tok:0};
function ksOrder(d){
  var box=document.getElementById('kOrder'), kp=KSHOP[String(d.n)], tok=++KO.tok;
  if(!kp){ box.hidden=true; return; }
  box.hidden=false; box.innerHTML='<div class="ofine">Loading sizes…</div>';
  fetch(SHOP+'/products/'+kp.h+'.js',{headers:{Accept:'application/json'}}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(p){
    if(tok!==KO.tok) return;
    var sizes=p.options[0].values, fmts=p.options[1].values, ar=kp.ar;
    var sopts=sizes.map(function(v){ var z=ksSize(v,ar); return '<option value="'+v.replace(/"/g,'&quot;')+'"'+(z.exact?' data-exact="1"':'')+'>'+z.label+(z.exact?' · exact fit':'')+'</option>'; }).join('');
    var fopts=fmts.map(function(v){ return '<option>'+v+'</option>'; }).join('');
    box.innerHTML='<label for="oSize">Size</label><select id="oSize">'+sopts+'</select>'+
      '<label for="oFmt">Surface</label><select id="oFmt">'+fopts+'</select>'+
      '<div class="orow"><span class="oprice" id="oPrice"></span><button type="button" id="oAdd">Add to cart</button></div>'+
      '<div class="ofine" id="oFine"></div>';
    var sz=document.getElementById('oSize'), fm=document.getElementById('oFmt');
    var ex=sz.querySelectorAll('option[data-exact]'); if(ex.length) sz.value=ex[ex.length-1].value;
    function cur(){ return p.variants.filter(function(v){ return v.option1===sz.value && v.option2===fm.value; })[0]; }
    function upd(){ var v=cur(), exact=!!sz.selectedOptions[0].getAttribute('data-exact');
      document.getElementById('oPrice').textContent=v?ksMoney(v.price):'-';
      document.getElementById('oAdd').disabled=!(v&&v.available);
      document.getElementById('oFine').innerHTML=(exact?'Prints edge to edge, nothing cropped.':'Not the painting’s proportions: printed whole with a border, never cropped.')+' Made to order, signed by MLow. <a href="'+SHOP+'/products/'+kp.h+'" target="_top">Full listing</a>'; }
    sz.onchange=fm.onchange=upd; upd();
    document.getElementById('oAdd').onclick=function(){ var v=cur(), b=this; if(!v) return; b.disabled=true; b.textContent='Adding…';
      var exact=!!sz.selectedOptions[0].getAttribute('data-exact');
      fetch(SHOP+'/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({items:[{id:v.id,quantity:1,properties:{Orientation:ksOrient(ar),Fit:exact?'Exact, edge to edge':'Whole image with border, no crop'}}]})})
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(){ b.textContent='Added'; ksCart(); document.getElementById('oFine').innerHTML='In your cart. <a href="'+SHOP+'/cart" target="_top">View cart</a> · <a href="'+SHOP+'/checkout" target="_top">Checkout</a>'; setTimeout(function(){ b.disabled=false; b.textContent='Add another'; },1200); })
      .catch(function(){ b.disabled=false; b.textContent='Add to cart'; document.getElementById('oFine').textContent='That did not reach the cart. Try again.'; });
    };
  }).catch(function(){ if(tok===KO.tok) box.innerHTML='<div class="ofine">Sizes did not load. <a href="'+SHOP+'/products/'+kp.h+'" target="_top">Order on the listing</a></div>'; });
}
ksCart();
</script>
"""

subs = [
    ("<head>", '<head>\n<base href="https://n3wyorkers.com/">'),
    ('<script src="assets/prints.js"></script>\n', ""),
    ('<script src="assets/keystone_prints.js"></script>\n', ""),
    ('<script src="assets/mint.js" defer></script>', ""),
    ('<a href="index.html" aria-label="NEW YORKERS home">', '<a href="https://mlow.nyc/" aria-label="MLow, The Salon">'),
    ('<a class="out" id="kLink" href="n/x000.html">See it in the census</a><a class="out" id="kPrint" href="#" target="_blank" rel="noopener" hidden>Order a print</a>',
     '<a class="out" id="kLink" href="n/x000.html" target="_blank" rel="noopener">See it in the census</a>'),
    ('<div class="statelbl" id="kStateLbl" aria-live="polite"></div>',
     '<div class="statelbl" id="kStateLbl" aria-live="polite"></div>\n  <div id="kOrder" hidden></div>'),
    ("v.preload = 'auto'; ST.v = v;", "v.preload = 'auto'; v.crossOrigin = 'anonymous'; ST.v = v;"),
    ("  #card a.out:hover{color:var(--blue-soft)}\n", "  #card a.out:hover{color:var(--blue-soft)}\n" + ORDER_CSS),
    ("<aside id=\"card\"", '<nav id="shopbar"><a href="https://mlow.nyc/">The Salon</a><a id="cartPill" href="https://mlow.nyc/cart">Cart</a></nav>\n\n<aside id="card"'),
]
for a, b in subs:
    if s.count(a) != 1: raise SystemExit(f"keystone_shopify: expected one match for {a[:70]!r}, found {s.count(a)}")
    s = s.replace(a, b)
# the site's print link becomes the in card order panel
s, n = re.subn(r"  \(function\(\)\{ var a=document\.getElementById\('kPrint'\).*?\}\)\(\);", "  ksOrder(d);", s, flags=re.S)
if n != 1: raise SystemExit("keystone_shopify: kPrint block not found")
s = s.replace("</body>", ORDER_JS.replace("__SHOPMAP__", json.dumps(SHOPMAP, separators=(",", ":"))) + "</body>", 1)
if "{% endraw %}" in s: raise SystemExit("keystone_shopify: page contains endraw")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write("{% layout none %}{% raw %}" + s + "{% endraw %}")
print(f"{os.path.relpath(OUT, SITE)}  {len(s)//1024} KB  {len(SHOPMAP)} pieces with listings")
