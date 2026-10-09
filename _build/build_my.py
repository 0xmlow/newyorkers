#!/usr/bin/env python3
"""my.html: a collector's own NEW YORKERS, in one place.

Paste a wallet or ENS name (or arrive on my#<wallet or name>) and the page becomes theirs:
their card, their badges, their own gallery in the museum, the same collection rehung in a dozen
other rooms, where each of their New Yorkers lives in the museum, the frame for the TV and the
wall for AR. Reads api/c/<wallet>.json written by build_collectors.py; nothing here is per wallet,
so this builder never needs rerunning when the holders change.

The museum hangs a collection with museum.html#room=<id>&hang=collector:<wallet or ENS>; the home
room is collectors/homes.json or, failing that, the room where most of their pieces already hang.
"""
import json, os
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
ROOMS = {r["id"]: r for r in json.load(open(os.path.join(HERE, "rooms.json")))}
# the variations: the collection rehung in rooms that feel like somewhere you would show art
VARIATIONS = ["metgreathall", "guggenheim", "momaatrium", "neuegalerie", "frick", "whitney", "dendur", "diachelsea",
              "chelseablock", "palmcourt", "empirestate", "goldvault", "dakota", "brooklynbridge", "subway", "coney"]
VAR = [{"id": r, "name": ROOMS[r]["name"], "area": ROOMS[r]["area"].title()} for r in VARIATIONS if r in ROOMS]
ROOMNAMES = {r: {"name": v["name"], "area": v["area"].title()} for r, v in ROOMS.items()}

body = """
<section class="wrap" style="padding-top:64px;padding-bottom:8px;position:relative" id="mFind">
  <img class="herologo" id="mLogo" alt="N3W YORKERS by MLow" hidden>
  <div class="kicker" style="color:var(--acid)">My NEW YORKERS</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px" id="mTitle">Your collection, your city.</h1>
  <p class="lede" style="margin-top:16px;max-width:820px" id="mLede">Paste your wallet or ENS name. Your New Yorkers get their own gallery in the museum, a frame for your TV, a wall in your home and a card with every badge you have earned.</p>
  <div id="mSince" hidden></div>
  <form class="cfind" id="mForm" autocomplete="off"><input id="mQ" placeholder="Your wallet or ENS name" aria-label="Wallet address or ENS name" spellcheck="false"><button class="btn" type="submit">Open my collection</button></form>
  <p class="cmsg" id="mMsg" role="status"></p>
</section>
<div id="mBody" hidden>
<section class="wrap mhead">
  <div class="mstats" id="mStats"></div>
  <div class="mbadges" id="mBadges"></div>
  <div class="mact" id="mAct"></div>
</section>
<section class="wrap msec" id="mHonor" hidden>
  <div class="mhon">
    <a class="mhonimg" id="mHonImgA"><img id="mHonImg" alt=""></a>
    <div><span class="mk">Honorary New Yorker</span><b id="mHonName"></b><span class="mhont" id="mHonTitle"></span><p id="mHonBio"></p>
      <div class="mact"><a class="btn" id="mHonPage">The honorary page</a><a class="btn ghost" id="mHonCard" download>Save the honorary card</a></div></div>
    <a class="mhoncard" id="mHonCardA"><img id="mHonCardImg" alt=""></a>
  </div>
</section>
<section class="wrap msec">
  <div class="kicker">Your gallery</div>
  <a class="mhome" id="mHome"><img alt="" id="mHomeImg"><div><span class="mk">Walk in</span><b id="mHomeName"></b><span id="mHomeSub"></span><span class="btn">Enter your gallery</span></div></a>
</section>
<section class="wrap msec">
  <div class="kicker">Rehang it anywhere</div>
  <p class="msub">The same collection, hung in another room of the city. Every room is a new show.</p>
  <div class="mrooms" id="mRooms"></div>
</section>
<section class="wrap msec mtwo">
  <a class="mbig" id="mTv"><span class="mk">On your TV</span><b>The living frame</b><span>Your New Yorkers on the big screen, one at a time, the moving ones moving. Cast it, AirPlay it or open it on the TV's browser.</span><span class="btn">Start the frame</span></a>
  <a class="mbig" id="mWall"><span class="mk">On your wall</span><b>See it in your home</b><span>Pick a New Yorker and a size, point your phone at a wall and see how it hangs before you print it.</span><span class="btn">Try it on a wall</span></a>
</section>
<section class="wrap msec">
  <div class="kicker">Your New Yorkers</div>
  <p class="msub" id="mPiecesSub"></p>
  <div class="mgrid" id="mGrid"></div>
</section>
<section class="wrap msec" id="mWhereSec">
  <div class="kicker">Where they live in the museum</div>
  <p class="msub">Every New Yorker hangs in exactly one room of the museum. These are the rooms holding yours.</p>
  <div class="mwhere" id="mWhere"></div>
</section>
<section class="wrap" style="padding-bottom:90px"><p class="cfoot" id="mFoot"></p></section>
</div>
"""

css = """
.cfind{display:flex;gap:10px;margin-top:28px;max-width:600px}
.cfind[hidden],#mBody[hidden],#mWhereSec[hidden]{display:none}
.cfind input{flex:1;min-width:0;background:var(--card);border:1px solid var(--divider);color:var(--cloud);border-radius:999px;padding:12px 18px;font-family:var(--mono);font-size:13px}
.cfind input:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.cmsg{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--slate);min-height:16px;margin-top:10px}
.ctag{display:inline-block;margin-left:12px;padding:3px 10px;border-radius:999px;border:1px solid var(--acid);color:var(--acid);font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;vertical-align:middle}
.mhead{padding-top:6px}
#mHonor[hidden]{display:none}
.mhon{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,.7fr);gap:22px;align-items:center;border:1px solid var(--acid);border-radius:14px;padding:20px;background:linear-gradient(160deg,#152536,#0F1218)}
.mhon img{width:100%;display:block;border-radius:10px}
.mhon b{display:block;font-family:var(--serif);font-size:32px;font-weight:500;color:var(--cloud);line-height:1.1}
.mhont{display:block;font-family:var(--serif);font-style:italic;color:var(--slate);margin-top:6px}
.mhon p{color:#CFD3CC;font-size:16px;line-height:1.55;margin:12px 0 0}
@media (max-width:900px){.mhon{grid-template-columns:1fr 1fr}.mhoncard{display:none}}
@media (max-width:600px){.mhon{grid-template-columns:1fr}}
.mstats{display:flex;flex-wrap:wrap;gap:28px;margin-top:6px}
.mstats div{display:flex;flex-direction:column}
.mstats b{font-family:var(--serif);font-size:34px;font-weight:500;color:var(--cloud);line-height:1}
.mstats span{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate);margin-top:6px}
.mbadges{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.mbadges span{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cloud);border:1px solid var(--divider);border-radius:999px;padding:4px 11px 4px 4px;background:var(--card)}
.mbadges i img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.mbadges i{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;border:1.5px solid currentColor;font-style:normal;font-size:12px}
.mact{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.msec{padding-top:46px}
.msub{color:var(--slate);font-size:15px;line-height:1.5;margin:8px 0 18px;max-width:760px}
.mk{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--acid);margin-bottom:8px}
.mhome{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);border:1px solid var(--divider);border-radius:14px;overflow:hidden;background:var(--card);text-decoration:none;margin-top:16px}
.mhome img{width:100%;height:100%;min-height:260px;object-fit:cover;display:block}
.mhome div{padding:28px;display:flex;flex-direction:column;justify-content:center;gap:8px}
.mhome b{font-family:var(--serif);font-size:34px;font-weight:500;color:var(--cloud);line-height:1.1}
.mhome div>span:not(.mk):not(.btn){color:var(--slate);font-size:14.5px;line-height:1.5}
.mhome .btn{align-self:flex-start;margin-top:10px}
.mhome:hover{border-color:var(--acid)}
.mrooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.mrooms a{display:block;border:1px solid var(--divider);border-radius:12px;overflow:hidden;background:var(--card);text-decoration:none}
.mrooms a:hover,.mrooms a:focus-visible{border-color:var(--acid)}
.mrooms img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.mrooms div{padding:10px 12px 12px}
.mrooms b{display:block;font-family:var(--sans);font-size:14px;font-weight:500;color:var(--cloud)}
.mrooms span{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate)}
.mrooms a.spin{display:flex;align-items:center;justify-content:center;min-height:170px;font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--acid);border-style:dashed}
.mtwo{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mbig{display:flex;flex-direction:column;gap:8px;border:1px solid var(--divider);border-radius:14px;padding:26px;background:linear-gradient(160deg,#152536,#0F1218);text-decoration:none}
.mbig:hover{border-color:var(--acid)}
.mbig b{font-family:var(--serif);font-size:30px;font-weight:500;color:var(--cloud)}
.mbig span:not(.mk):not(.btn){color:var(--slate);font-size:14.5px;line-height:1.5}
.mbig .btn{align-self:flex-start;margin-top:8px}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.mgrid figure{margin:0;border:1px solid var(--divider);border-radius:10px;overflow:hidden;background:var(--card)}
.mgrid figure.k{border-color:var(--acid)}
.mgrid img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#111}
.mgrid .nt{aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:10px;text-align:center;font-family:var(--serif);color:var(--cloud);font-size:15px}
.mgrid figcaption{padding:8px 10px 10px}
.mgrid figcaption b{display:block;font-family:var(--sans);font-size:12.5px;font-weight:500;color:var(--cloud);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mgrid figcaption span{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate)}
.mgrid nav{display:flex;gap:6px;margin-top:7px}
.mgrid nav a{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--cloud);border:1px solid var(--divider);border-radius:999px;padding:3px 8px;text-decoration:none}
.mgrid nav a:hover{border-color:var(--acid);color:var(--acid)}
.mwhere{display:flex;flex-wrap:wrap;gap:8px}
.mwhere a{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--cloud);border:1px solid var(--divider);border-radius:999px;padding:7px 12px;text-decoration:none;background:var(--card)}
.mwhere a b{color:var(--acid);font-weight:500;margin-left:6px}
.mwhere a:hover{border-color:var(--acid)}
.cfoot{font-family:var(--mono);font-size:11px;line-height:1.7;letter-spacing:.06em;color:var(--slate);max-width:820px}
.cfoot a{color:var(--cloud)}
@media (max-width:760px){.mhome{grid-template-columns:1fr}.mhome img{min-height:190px}.mtwo{grid-template-columns:1fr}.cfind{flex-direction:column}.mstats{gap:20px}.mstats b{font-size:28px}.mrooms{grid-template-columns:repeat(2,1fr)}.mgrid{grid-template-columns:repeat(2,1fr)}}
"""

js = """<script src="assets/sha3.min.js"></script>
<script src="assets/collector-card.js"></script>
<script>
(function(){
var VAR=__VAR__, RN=__ROOMS__, B=window.NY_BASE||'', $=function(i){return document.getElementById(i);}, cur=null, IDX=null;
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function short(a){return a.slice(0,6)+'\\u2026'+a.slice(-4);}
function stat(b,s){var d=h('div');d.appendChild(h('b',null,b));d.appendChild(h('span',null,s));return d;}
// ENS names a wallet points at but never set as primary still resolve: forward lookup on chain
var ENS_REG='0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e', RPCS=['https://ethereum-rpc.publicnode.com','https://eth.drpc.org'];
function hexBytes(x){var u=new Uint8Array(x.length/2);for(var i=0;i<u.length;i++)u[i]=parseInt(x.substr(i*2,2),16);return u;}
function namehash(n){var node='0000000000000000000000000000000000000000000000000000000000000000';var L=n.split('.');for(var i=L.length-1;i>=0;i--)node=window.keccak_256(hexBytes(node+window.keccak_256(L[i])));return node;}
function rpc(i,to,data){if(i>=RPCS.length)return Promise.reject(new Error('no rpc'));return fetch(RPCS[i],{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:to,data:data},'latest']})}).then(function(r){return r.json();}).then(function(j){if(!j||typeof j.result!=='string')throw 0;return j.result;}).catch(function(){return rpc(i+1,to,data);});}
function resolveName(n){if(!window.keccak_256)return Promise.resolve(null);var node=namehash(n);return rpc(0,ENS_REG,'0x0178b8bf'+node).then(function(r){var res='0x'+r.slice(-40);if(/^0x0{40}$/.test(res))return null;return rpc(0,res,'0x3b3b57de'+node).then(function(r2){var a='0x'+r2.slice(-40);return /^0x0{40}$/.test(a)?null:a;});}).catch(function(){return null;});}
function index(){return IDX?Promise.resolve(IDX):fetch(B+'api/c/index.json').then(function(r){return r.json();}).then(function(j){IDX=j;return j;});}
function lookup(q){
  q=q.trim().toLowerCase();
  if(/^0x[0-9a-f]{40}$/.test(q))return Promise.resolve(q);
  return index().then(function(ix){for(var a in ix)if((ix[a]||'').toLowerCase()===q)return a;return /\\./.test(q)?resolveName(q):null;});
}
function open(q){
  var msg=$('mMsg');if(!q)return;msg.textContent='Looking up '+q+'\\u2026';
  lookup(q).then(function(a){
    if(!a){msg.textContent='That name does not resolve to a wallet. Paste the 0x address instead.';return null;}
    return fetch(B+'api/c/'+a.toLowerCase()+'.json').then(function(r){if(!r.ok){msg.textContent='That wallet holds no NEW YORKERS as of this snapshot. Mint one and it opens here at the next read.';return null;}return r.json();});
  }).then(function(d){if(d){msg.textContent='';paint(d,q);}}).catch(function(){msg.textContent='Could not load that collection. Try again in a moment.';});
}
function paint(d,q){
  cur=d;var key=(d.ens||d.a).toLowerCase(),name=d.nm||d.ens||short(d.a),hang='&hang=collector:'+encodeURIComponent(key);
  document.title=name+' · My NEW YORKERS';
  if(window.NY_LOGOS){var ml=$('mLogo');ml.src=window.NY_LOGOS.url(window.NY_LOGOS.forKey(key));ml.alt='The N3W YORKERS logo on '+name+'\u2019s card';ml.hidden=false;}
  var t=$('mTitle');t.textContent=name;if(d.tag)t.appendChild(h('span','ctag',d.tag));
  /* since your last visit: new rooms, new honorees, and this collector's move on the board (site.js NY.since) */
  if(window.NY&&NY.since) NY.since($('mSince'),{key:'my-'+key,rankKey:key,rank:d.rank,of:d.of});
  $('mLede').textContent=d.census+d.keystone+' New Yorker'+(d.census+d.keystone===1?'':'s')+'. Number '+d.rank+' of '+d.of+' on the collectors board.';
  $('mForm').hidden=true;
  var st=$('mStats');st.innerHTML='';st.appendChild(stat('#'+d.rank,'of '+d.of+' collectors'));st.appendChild(stat(d.pts.toLocaleString(),'points'));st.appendChild(stat(d.census,'census'));if(d.keystone)st.appendChild(stat(d.keystone,'Keystone'));st.appendChild(stat(d.badges.length,'badges'));
  var bd=$('mBadges');bd.innerHTML='';d.badges.forEach(function(id){var b=d.badgeDefs[id];if(!b)return;var s=h('span');s.title=b.rule;var i=h('i',null,b.img?null:b.icon);i.style.color=b.color;if(b.img){var bi=h('img');bi.src=B+b.img;bi.alt='';i.appendChild(bi);}s.appendChild(i);s.appendChild(document.createTextNode(b.name));bd.appendChild(s);});
  var ac=$('mAct');ac.innerHTML='';
  var dl=h('button','btn','Download my card');dl.type='button';var defs={};for(var k in d.badgeDefs)defs[k]=d.badgeDefs[k];
  dl.onclick=function(){NYCard(d,{badges:defs,meta:{collectors:d.of,asOf:d.asOf}},dl);};ac.appendChild(dl);
  var lb=h('a','btn ghost','On the leaderboard');lb.href=B+'collectors.html#'+d.a;ac.appendChild(lb);
  var cp=h('button','btn ghost','Copy my link');cp.type='button';cp.onclick=function(){var u=location.origin+location.pathname.replace(/\\.html$/,'')+'#'+key;try{navigator.clipboard.writeText(u);cp.textContent='Copied';}catch(e){prompt('Copy this link',u);}};ac.appendChild(cp);
  var ho=d.honor;$('mHonor').hidden=!ho;
  if(ho){$('mHonName').textContent=ho.name;$('mHonTitle').textContent=(ho.handle?ho.handle+'  ':'')+(ho.title?'\u201c'+ho.title+'\u201d':'');$('mHonBio').textContent=ho.bio||'';
    $('mHonImg').src=B+(ho.img||ho.card);$('mHonImg').alt=ho.name+', painted by MLow';$('mHonImgA').href=B+ho.page;$('mHonPage').href=B+ho.page;
    $('mHonCardA').hidden=!ho.card;$('mHonCard').hidden=!ho.card;
    if(ho.card){$('mHonCardImg').src=B+ho.card;$('mHonCardImg').alt='The honorary card for '+ho.name;$('mHonCardA').href=B+ho.card;$('mHonCard').href=B+ho.card;$('mHonCard').setAttribute('download','honorary-new-yorker-'+ho.id+'.jpg');}}
  var hr=RN[d.home]||{name:d.homeName,area:''};
  $('mHome').href=B+'museum.html#room='+d.home+hang;$('mHomeImg').src=B+'assets/museum/rooms/'+d.home+'.jpg';
  $('mHomeName').textContent=hr.name;$('mHomeSub').textContent=(hr.area?hr.area+'. ':'')+'Your New Yorkers on the walls, and only yours. Walk it, take the guided tour, share the link.';
  var rm=$('mRooms');rm.innerHTML='';
  VAR.filter(function(v){return v.id!==d.home;}).slice(0,15).forEach(function(v){var a=h('a');a.href=B+'museum.html#room='+v.id+hang;var im=h('img');im.loading='lazy';im.alt='';im.src=B+'assets/museum/rooms/'+v.id+'.jpg';a.appendChild(im);var x=h('div');x.appendChild(h('b',null,v.name));x.appendChild(h('span',null,v.area));a.appendChild(x);rm.appendChild(a);});
  var sp=h('a','spin','Spin a room');sp.href=B+'museum.html#room=random'+hang;rm.appendChild(sp);
  $('mTv').href=B+'tv.html#'+key;$('mWall').href=B+'wall.html#'+key;
  $('mPiecesSub').textContent='Every New Yorker you hold. Open one, see it on your wall, or find it on its own wall in the museum.';
  var g=$('mGrid');g.innerHTML='';
  d.pieces.forEach(function(p,i){
    var f=h('figure',p.c==='keystone'?'k':'');
    if(p.th){var im=h('img');im.loading='lazy';im.decoding='async';im.alt=p.t;im.src=B+p.th;f.appendChild(im);}else f.appendChild(h('div','nt',p.t));
    var c=h('figcaption');c.appendChild(h('b',null,p.t));c.appendChild(h('span',null,p.c==='keystone'?'Keystone'+(p.n?' · NO. '+p.n:''):'NO. '+p.n));
    var n=h('nav');
    if(p.id){var o=h('a',null,'Open');o.href=B+'n/'+p.id+'.html';n.appendChild(o);}
    else{var o2=h('a',null,'Keystone');o2.href=B+'keystone.html';n.appendChild(o2);}
    if(p.th){var w=h('a',null,'Wall');w.href=B+'wall.html#'+key+'&p='+(p.c==='keystone'?'k':'')+p.tok;n.appendChild(w);}
    c.appendChild(n);f.appendChild(c);g.appendChild(f);
  });
  var wh=$('mWhere');wh.innerHTML='';(d.where||[]).forEach(function(w){var a=h('a');a.href=B+'museum.html#room='+w.room;a.appendChild(document.createTextNode(w.name));a.appendChild(h('b',null,w.n));wh.appendChild(a);});
  $('mWhereSec').hidden=!(d.where&&d.where.length);
  $('mFoot').textContent='Holdings read off Ethereum on '+d.asOf+'. Keystone pieces without a census number hang on the Keystone wall, not in the museum rooms.';
  $('mBody').hidden=false;
  try{history.replaceState(null,'','#'+key);}catch(e){}
}
if(window.NY_LOGOS&&!location.hash){var L0=window.NY_LOGOS,m0=$('mLogo');m0.src=L0.url(L0.LOCKUPS[Math.floor(Math.random()*L0.LOCKUPS.length)]);m0.hidden=false;}
$('mForm').onsubmit=function(e){e.preventDefault();open($('mQ').value);};
var hs=decodeURIComponent(location.hash.slice(1));if(hs){$('mQ').value=hs;open(hs);}
})();
</script>""".replace("__VAR__", json.dumps(VAR, ensure_ascii=False)).replace("__ROOMS__", json.dumps(ROOMNAMES, ensure_ascii=False))

page = shell(title="My NEW YORKERS · NEW YORKERS by MLow",
             description="Your NEW YORKERS in one place: your own gallery in the museum, the collection rehung in any room of the city, a frame for your TV, a wall in your home and your collector card.",
             body=body, path="my.html", active=None, extra_css=css, scripts_after=js,
             keywords=["NEW YORKERS", "MLow", "collector", "gallery", "my collection", "NFT display", "AR"],
             jsonld={"@context": "https://schema.org", "@type": "WebPage", "name": "My NEW YORKERS", "url": URL + "/my.html",
                     "creator": {"@type": "Person", "name": "MLow"}, "isPartOf": {"@id": URL + "/#collection"}})
open(os.path.join(SITE, "my.html"), "w").write(page)
print(f"my.html: {len(VAR)} variation rooms")
