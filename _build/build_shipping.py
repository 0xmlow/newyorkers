#!/usr/bin/env python3
"""shipping.html: an honest shipping, tax and duty estimator built on _build/learn/shipping_model.json.

It is an ESTIMATOR and says so everywhere. It bills the greater of actual and dimensional weight, the way
couriers really do, applies the fuel and oversize surcharges, and shows import duty and VAT separately from
shipping because the buyer usually pays those on delivery. Every rate is from the model file; nothing is
typed into the page."""
import json, os
from page_shell import shell, esc, cfg
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
M = json.load(open(os.path.join(HERE, "learn", "shipping_model.json"), encoding="utf-8"))
open(os.path.join(SITE, "assets", "shipping.js"), "w", encoding="utf-8").write(
    "window.NY_SHIP = " + json.dumps(M, separators=(",", ":"), ensure_ascii=False) + ";\n")

SIZES = ["8 x 10 in","8 x 12 in","10 x 10 in","16 x 20 in","16 x 24 in","20 x 30 in","30 x 40 in","36 x 48 in","40 x 60 in","48 x 72 in"]
FORMATS = [("giclee_fine_art_print","Giclee Fine-Art Print"),("canvas_gallery_wrap","Canvas Gallery Wrap"),
           ("wood_print","Wood Print"),("metal_print","MetalPrint"),("acrylic_face_mount","Acrylic Face-Mount")]

body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:16px">
  <div class="kicker">Shipping, duty and tax</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:980px">What it costs to get it to you.</h1>
  <p class="lede" style="margin-top:20px;max-width:840px;color:var(--slate)">Prints ship from New York City. Pick a size, a format and where you are, and this estimates the carrier cost, the sales tax if you are in the United States, and the import duty and VAT if you are not.</p>
  <p class="body" style="margin-top:14px;max-width:840px"><b style="color:var(--pink)">This is an estimate, not a quote.</b> The real number is confirmed at checkout. Duty and import VAT are usually collected by the carrier on delivery and are the buyer's responsibility.</p>
</section>

<section class="wrap" style="padding-bottom:30px">
  <div class="calc">
    <div class="inputs">
      <label>Size<select id="size">{"".join(f'<option>{esc(s)}</option>' for s in SIZES)}</select></label>
      <label>Format<select id="fmt">{"".join(f'<option value="{k}">{esc(n)}</option>' for k, n in FORMATS)}</select></label>
      <label>Ships to<select id="zone">{"".join(f'<option value="{esc(z["id"])}">{esc(z["name"])}</option>' for z in M["zones"])}</select></label>
      <label id="stateWrap" hidden>US state<select id="state"></select></label>
      <label>Price of the piece, USD<input id="value" type="number" min="0" step="10" value="350"></label>
    </div>
    <div class="out" id="out"></div>
  </div>
</section>

<section class="wrap section" style="padding-top:10px">
  <div class="article" style="margin:0;max-width:860px">
    <h2 style="font-size:clamp(22px,2.4vw,30px);font-weight:600">The thing most people get wrong</h2>
    <p class="body" style="margin-top:12px">Carriers bill the greater of actual weight and <b style="color:var(--cloud)">dimensional weight</b>, which is the size of the box divided by a fixed number. A 40 by 60 inch flat pack weighs about twenty pounds and bills like eighty. Above a certain length plus girth a large package surcharge lands as a flat step, not a slope. Box depth is worth more to the final price than the destination is.</p>
    <h2 style="font-size:clamp(22px,2.4vw,30px);font-weight:600;margin-top:36px">Why these are not treated as art at the border</h2>
    <p class="body" style="margin-top:12px">{esc(M["import"]["classification_warning"][:700])}</p>
    <h2 style="font-size:clamp(22px,2.4vw,30px);font-weight:600;margin-top:36px">The small print, in plain English</h2>
    <ul class="disc">{"".join(f'<li>{esc(d)}</li>' for d in M["disclaimers"])}</ul>
    <h2 style="font-size:clamp(22px,2.4vw,30px);font-weight:600;margin-top:36px">Where these numbers come from</h2>
    <ul class="sources" style="margin-top:8px">{"".join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["name"])}</a><br>{esc(s.get("what_it_covers",""))}</li>' for s in M["sources"])}</ul>
    <p class="body" style="margin-top:22px;font-size:14px">Model last checked {esc(M.get("generated",""))}. Tariff and de minimis rules changed several times in the last year, so if you are reading this long after that date, check your own country's current position.</p>
  </div>
</section>"""

extra_css = """
.calc{display:grid;grid-template-columns:340px 1fr;gap:34px;align-items:start}
@media (max-width:860px){.calc{grid-template-columns:1fr}}
.inputs{display:flex;flex-direction:column;gap:15px}
.inputs label{display:flex;flex-direction:column;gap:7px;font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate)}
.inputs select,.inputs input{background:var(--card);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:13px 14px;border-radius:7px;outline:none;width:100%}
.inputs select:focus,.inputs input:focus{border-color:var(--blue)}
.out{background:var(--card);border:1px solid var(--divider);border-radius:14px;padding:26px 28px 28px;min-height:260px}
.out .row{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--divider);font-family:var(--sans);font-size:15px}
.out .row span:first-child{color:var(--slate)}
.out .row b{font-family:var(--mono);font-weight:500;color:var(--cloud)}
.out .row.tot{border-bottom:none;border-top:2px solid var(--blue);margin-top:8px;padding-top:16px;font-size:19px}
.out .row.tot b{color:var(--cyan);font-size:22px}
.out .row.sub b{color:var(--slate)}
.out h4{font-family:var(--sans);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--blue);margin:20px 0 4px;font-weight:600}
.out .note{font-family:var(--sans);font-size:13.5px;line-height:1.6;color:var(--slate);margin-top:16px;border-top:1px solid var(--divider);padding-top:14px}
.out .warn{color:var(--pink)}
.disc li{font-family:var(--sans);font-size:15px;line-height:1.65;color:#CFD3CC;margin-bottom:10px}
.sources li{font-family:var(--sans);font-size:14.5px;line-height:1.55;color:var(--slate);padding:10px 0;border-bottom:1px solid var(--divider);list-style:none}
.sources li a{color:var(--cloud)}.sources li a:hover{color:var(--cyan)}
"""

script = """
<script src="assets/shipping.js"></script>
<script>
(function(){
 var M=window.NY_SHIP, $=function(s){return document.querySelector(s)};
 var money=function(n){return "$"+(Math.round(n*100)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})};
 var ST=M.us_sales_tax.rates||{};
 $("#state").innerHTML=Object.keys(ST).sort().map(function(k){return '<option value="'+k+'">'+k+'</option>'}).join("");
 var homeState=(M.us_sales_tax.nexus_default||["NY"])[0];
 if(ST[homeState]) $("#state").value=homeState;
 function dims(){
   var p=$("#size").value.replace(/\\s*in$/,'').split("x").map(function(x){return parseFloat(x)});
   return {w:p[0],h:p[1],area:p[0]*p[1]};
 }
 function calc(){
   var d=dims(), fk=$("#fmt").value, W=M.weights[fk], z=M.zones.filter(function(x){return x.id===$("#zone").value})[0];
   var val=parseFloat($("#value").value)||0;
   var actual=W.base_lb + W.lb_per_sqin*d.area + W.packaging_lb;
   // box: the print plus packing margin, depth by format
   var depth = fk==="canvas_gallery_wrap"?3.5 : fk==="acrylic_face_mount"?3.0 : fk==="wood_print"?2.5 : fk==="metal_print"?2.0 : 2.0;
   var bw=d.w+4, bh=d.h+4, div=M.dim_weight.divisor_in_lb_domestic;
   var dim=(bw*bh*depth)/div;
   var billed=Math.max(actual,dim);
   var girth=Math.max(bw,bh)+2*(Math.min(bw,bh)+depth);
   var ship=z.base_usd + z.per_lb_usd*billed;
   var fuel=ship*(M.surcharges.fuel_surcharge.rate||M.surcharges.fuel_surcharge.value||0.16);
   var big=0, bigWhy="";
   var lps=M.surcharges.large_package_surcharge||{};
   if(girth >= (lps.threshold_length_plus_girth_in||130)){ big=lps.amount_usd||185; bigWhy="length plus girth "+Math.round(girth)+" in"; }
   else if((M.surcharges.oversize_or_additional_handling||{}).threshold_longest_side_in && Math.max(bw,bh)>=M.surcharges.oversize_or_additional_handling.threshold_longest_side_in){
     big=M.surcharges.oversize_or_additional_handling.amount_usd||0; bigWhy="oversize, longest side "+Math.round(Math.max(bw,bh))+" in";
   }
   var ins=val*((M.surcharges.insurance_declared_value||{}).rate||0.01);
   var carrier=ship+fuel+big+ins;
   var rows=[];
   rows.push(['Actual weight', actual.toFixed(1)+' lb']);
   rows.push(['Dimensional weight', dim.toFixed(1)+' lb']);
   rows.push(['Billed at', '<b>'+billed.toFixed(1)+' lb</b>'+(dim>actual?' (dimensional)':' (actual)')]);
   var html='<h4>The box</h4>'+rows.map(function(r){return '<div class="row sub"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join("");
   html+='<h4>Carrier</h4>';
   html+='<div class="row"><span>Base and weight, '+z.name+'</span><b>'+money(ship)+'</b></div>';
   html+='<div class="row"><span>Fuel surcharge</span><b>'+money(fuel)+'</b></div>';
   if(big) html+='<div class="row"><span class="warn">Large package surcharge, '+bigWhy+'</span><b>'+money(big)+'</b></div>';
   html+='<div class="row"><span>Insurance on '+money(val)+'</span><b>'+money(ins)+'</b></div>';
   html+='<div class="row tot"><span>Estimated shipping</span><b>'+money(carrier)+'</b></div>';
   var isUS = z.countries.indexOf("US")>=0;
   if(isUS){
     var st=$("#state").value, rate=ST[st]||0;
     var nexus=(M.us_sales_tax.nexus_default||["NY"]).indexOf(st)>=0;
     html+='<h4>US sales tax</h4>';
     if(nexus) html+='<div class="row"><span>'+st+' at '+(rate*100).toFixed(2)+'%</span><b>'+money(val*rate)+'</b></div>';
     else html+='<div class="row sub"><span>'+st+' at '+(rate*100).toFixed(2)+'% applies only where the seller is registered</span><b>not collected</b></div>';
     html+='<div class="row tot"><span>Estimated total on top of the piece</span><b>'+money(carrier+(nexus?val*rate:0))+'</b></div>';
   } else {
     var imp=(M.import.countries||[]).filter(function(c){ return (z.countries||[]).some(function(cc){ return (c.country||'').toLowerCase().indexOf((z.name||'').split(',')[0].toLowerCase())>=0; }); })[0];
     if(!imp) imp=(M.import.countries||[]).filter(function(c){ return z.examples && z.examples.some(function(e){ return c.country===e; }); })[0];
     html+='<h4>Import, paid by you on delivery</h4>';
     if(imp){
       var dutyRate=(imp.duty_rate_print!=null?imp.duty_rate_print:(imp.duty_rate_art||0));
       // These are digitally printed reproductions, so the PRINT rate applies, not the art rate.
       // Using vat_or_gst_rate here would quote the Chapter 97 art relief the pieces do not qualify for.
       var vatRate=(imp.vat_rate_print!=null?imp.vat_rate_print:(imp.vat_or_gst_rate||0));
       var artRate=(imp.vat_or_gst_rate!=null?imp.vat_or_gst_rate:vatRate);
       var duty=val*dutyRate;
       var vat=(val+carrier+duty)*vatRate;
       html+='<div class="row"><span>Duty on a print, '+imp.country+'</span><b>'+money(duty)+'</b></div>';
       html+='<div class="row"><span>Import VAT or GST at '+(vatRate*100).toFixed(1)+'%, print rate</span><b>'+money(vat)+'</b></div>';
       if(artRate<vatRate) html+='<div class="row sub"><span>If it qualified as art it would be '+(artRate*100).toFixed(1)+'%. It does not. See below.</span><b>'+money((val+carrier+duty)*artRate)+'</b></div>';
       html+='<div class="row tot"><span>Estimated landed total on top of the piece</span><b>'+money(carrier+duty+vat)+'</b></div>';
       html+='<div class="note">'+(imp.note||"").slice(0,300)+'</div>';
     } else {
       html+='<div class="row sub"><span>No modelled rate for this zone</span><b>ask for a quote</b></div>';
       html+='<div class="row tot"><span>Estimated shipping only</span><b>'+money(carrier)+'</b></div>';
     }
   }
   html+='<div class="note"><b class="warn">Estimate, not a quote.</b> Confirmed at checkout. '+(z.days_min||"")+' to '+(z.days_max||"")+' days in transit once it ships.</div>';
   $("#out").innerHTML=html;
   $("#stateWrap").hidden=!isUS;
 }
 ["#size","#fmt","#zone","#state","#value"].forEach(function(s){ $(s).addEventListener("input",calc); $(s).addEventListener("change",calc); });
 calc();
})();
</script>"""

page = shell(title="Shipping, duty and tax · prints by MLow",
             description="Estimate what it costs to ship a print from New York City anywhere in the world, including sales tax, import duty and VAT. An estimate, not a quote.",
             body=body, path="shipping.html", active=None,
             keywords=["art print shipping cost","international art shipping duty","import VAT on art prints","shipping calculator art"],
             extra_css=extra_css, scripts_after=script)
open(os.path.join(SITE, "shipping.html"), "w", encoding="utf-8").write(page)
print(f"shipping.html written: {len(M['zones'])} zones, {len(M['import']['countries'])} import countries, {len(M['sources'])} sources")
