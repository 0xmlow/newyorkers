#!/usr/bin/env python3
"""tv.html: the living frame. One collector's NEW YORKERS, full screen, on a TV.

tv.html#<wallet or ENS>[&s=<seconds>][&shuffle=1][&motion=0][&captions=0]

No hash: a setup screen (who, how long per piece, shuffle, captions, motion clips) plus the three ways
to get it onto a TV (Cast, AirPlay, the TV's own browser) and a QR of the exact frame URL.
With a hash: the frame loads that collector from api/c/<address>.json and starts playing at once, so
a TV browser or a cast receiver that cannot be clicked still gets the art. Fullscreen needs a gesture,
so the Start button asks for it and a small button (or F) asks again on the TV.

The page is built with shell() for the head conventions, but the site chrome (#nav, #foot and the
mint bar mint.js injects as #ny-mintbar) is hidden: this page is a black stage, not a page.
The inline script is plain ES5 style on purpose (var, function, XHR): TV browsers are old.
"""
import json, os
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]

body = """
<main id="tvSetup" class="tvs">
  <div class="tvs-in" style="position:relative">
    <img class="herologo" id="tvLogo" alt="N3W YORKERS by MLow" hidden>
    <a class="tvs-logo" href="index.html" aria-label="NEW YORKERS home"><img src="assets/brand/logo_white.png" alt="NEW YORKERS"></a>
    <div class="kicker" style="color:var(--acid)">The living frame</div>
    <h1 class="tvs-h">Your New Yorkers, on the wall.</h1>
    <p class="tvs-lede">Put in a wallet or an ENS name. The frame plays every New Yorker it holds, one at a time, full screen, until you stop it.</p>
    <form id="tvForm" class="tvs-form" autocomplete="off">
      <label class="tvs-lab" for="tvWho">Wallet or ENS</label>
      <input id="tvWho" class="tvs-in-who" type="text" placeholder="adamweitsman.eth or 0x..." spellcheck="false" autocapitalize="off">
      <div id="tvMsg" class="tvs-msg" role="status" aria-live="polite"></div>
      <div class="tvs-opts">
        <label>Each piece
          <select id="tvSec"><option value="10">10 seconds</option><option value="20" selected>20 seconds</option><option value="60">1 minute</option><option value="300">5 minutes</option></select>
        </label>
        <label class="ck"><input type="checkbox" id="tvShuf"> Shuffle</label>
        <label class="ck"><input type="checkbox" id="tvCap" checked> Captions</label>
        <label class="ck"><input type="checkbox" id="tvMot" checked> Play motion clips</label>
      </div>
      <button id="tvStart" class="btn tvs-start" type="submit">Start the frame</button>
      <p class="tvs-keys">On the frame: left and right to move, Enter to pause, C for captions, I for info, Escape to come back here.</p>
    </form>

    <section class="tvs-tv" aria-labelledby="tvTvH">
      <h2 id="tvTvH" class="tvs-h2">Put it on your TV</h2>
      <div class="tvs-grid">
        <div class="tvs-ways">
          <div class="way"><b>Cast</b>
            <p>Chromecast or Google TV: use the button below, or the Cast item in the Chrome menu.</p>
            <button id="tvCast" class="btn ghost" type="button" hidden>Cast to a TV</button>
            <p id="tvCastMsg" class="tvs-small"></p>
          </div>
          <div class="way"><b>AirPlay</b>
            <p>On a Mac, iPhone or iPad: Control Center, Screen Mirroring, pick the Apple TV or AirPlay TV. Then start the frame.</p>
          </div>
          <div class="way"><b>On the TV itself</b>
            <p>Open the TV's web browser and go to</p>
            <p class="tvs-url" id="tvShort">n3wyorkers.com/tv</p>
            <p>Or scan the code with a phone and cast from there.</p>
          </div>
        </div>
        <figure class="tvs-qr"><canvas id="tvQr" width="260" height="260" aria-label="QR code for this frame"></canvas><figcaption id="tvQrCap">Put in a wallet to get its code.</figcaption></figure>
      </div>
    </section>
  </div>
</main>

<div id="tvStage" class="tvp" hidden>
  <div class="tvl" id="tvA"></div>
  <div class="tvl" id="tvB"></div>
  <div class="tvcap" id="tvCapBox"><b id="tvCT"></b><span id="tvCN"></span></div>
  <div class="tvsig" id="tvSig"><span>N3WYORKERS.COM</span><i id="tvWhoName"></i></div>
  <div class="tvpause" id="tvPause" aria-hidden="true"><i></i><i></i></div>
  <div class="tvload" id="tvLoad">Loading</div>
  <div class="tvinfo" id="tvInfo" hidden>
    <div class="tvinfo-in">
      <div class="kicker" style="color:var(--acid)">On the wall</div>
      <h2 id="tvIName"></h2>
      <p id="tvIStats" class="mono"></p>
      <div id="tvIBadges" class="chips"></div>
      <p class="mono dim">Left and right to move. Enter to pause. C for captions. I to close. Escape for setup.</p>
    </div>
  </div>
  <div class="tvbar" id="tvBar">
    <button type="button" tabindex="-1" data-a="prev" aria-label="Previous">Prev</button>
    <button type="button" tabindex="-1" data-a="pause" aria-label="Pause or play" id="tvBP">Pause</button>
    <button type="button" tabindex="-1" data-a="next" aria-label="Next">Next</button>
    <button type="button" tabindex="-1" data-a="cap" aria-label="Captions">Captions</button>
    <button type="button" tabindex="-1" data-a="info" aria-label="Info">Info</button>
    <button type="button" tabindex="-1" data-a="fs" aria-label="Full screen" id="tvBF">Full screen</button>
    <button type="button" tabindex="-1" data-a="exit" aria-label="Back to setup">Setup</button>
  </div>
</div>
"""

css = """
#nav,#foot,#ny-mintbar{display:none!important}
html,body{background:#000}
.tvs [hidden]{display:none!important}
body.tv-on{overflow:hidden}
.tvs{min-height:100vh;background:var(--ink);padding:48px 16px 80px}
.tvs-in{max-width:1080px;margin:0 auto}
.tvs-logo img{height:34px;width:auto;display:block;margin-bottom:34px}
.tvs-h{font-family:var(--serif);font-weight:500;font-size:clamp(34px,5vw,64px);line-height:1.04;margin:14px 0 0;letter-spacing:-.01em}
.tvs-lede{font-family:var(--sans);color:var(--slate);font-size:17px;line-height:1.6;max-width:680px;margin:16px 0 0}
.tvs-form{margin-top:34px;max-width:760px}
.tvs-lab{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate);margin-bottom:8px}
.tvs-in-who{width:100%;box-sizing:border-box;background:var(--card);border:1px solid var(--divider);color:var(--cloud);font-family:var(--mono);font-size:20px;padding:16px 18px;border-radius:10px;outline:none}
.tvs-in-who:focus{border-color:var(--acid)}
.tvs-msg{min-height:22px;margin-top:10px;font-family:var(--mono);font-size:13px;color:var(--slate)}
.tvs-msg.ok{color:var(--acid)}.tvs-msg.bad{color:var(--pink)}
.tvs-opts{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin-top:14px;font-family:var(--sans);font-size:15px;color:var(--cloud)}
.tvs-opts select{margin-left:8px;background:var(--card);color:var(--cloud);border:1px solid var(--divider);border-radius:8px;padding:8px 10px;font-family:var(--sans);font-size:15px}
.tvs-opts .ck{display:inline-flex;align-items:center;gap:8px;cursor:pointer}
.tvs-opts input[type=checkbox]{width:18px;height:18px;accent-color:var(--acid)}
.tvs-start{margin-top:26px;font-size:16px;padding:22px 40px;background:var(--acid);border-color:var(--acid);color:var(--ink)}
.tvs-start:focus-visible,.tvs .btn:focus-visible,.tvs select:focus-visible,.tvs input:focus-visible{outline:3px solid var(--acid);outline-offset:3px}
.tvs-keys{font-family:var(--mono);font-size:12px;color:var(--slate);margin-top:16px;line-height:1.6}
.tvs-tv{margin-top:64px;border-top:1px solid var(--divider);padding-top:34px}
.tvs-h2{font-family:var(--serif);font-weight:500;font-size:clamp(26px,3vw,38px);margin:0}
.tvs-grid{display:flex;gap:34px;margin-top:22px;align-items:flex-start}
.tvs-ways{flex:1 1 auto;display:flex;flex-direction:column;gap:22px}
.way b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--acid);margin-bottom:6px}
.way p{font-family:var(--sans);color:var(--cloud);font-size:15px;line-height:1.55;margin:0 0 6px}
.way .btn{margin-top:8px}
.tvs-small{font-family:var(--mono);font-size:12px;color:var(--slate)!important}
.tvs-url{font-family:var(--mono)!important;font-size:19px!important;color:var(--acid)!important;word-break:break-all}
.tvs-qr{flex:0 0 260px;margin:0;text-align:center}
.tvs-qr canvas{width:260px;height:260px;border-radius:12px;background:#fff;display:block}
.tvs-qr figcaption{font-family:var(--mono);font-size:11px;color:var(--slate);margin-top:10px;line-height:1.5;word-break:break-all}
@media (max-width:720px){.tvs-grid{flex-direction:column}.tvs-qr{flex:0 0 auto;align-self:center}}

.tvp{position:fixed;inset:0;top:0;left:0;right:0;bottom:0;background:#000;z-index:2147483600;overflow:hidden;color:var(--cloud)}
.tvp[hidden]{display:none}
.tvp.idle{cursor:none}
.tvl{position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;transition:opacity 2s ease;display:flex;align-items:center;justify-content:center}
.tvl.on{opacity:1}
.tvl img,.tvl video{width:100%;height:100%;object-fit:contain;display:block;transform-origin:50% 50%}
.tvl.kb img,.tvl.kb video{animation:tvkb var(--kb,22s) linear forwards}
.tvp.paused .tvl img,.tvp.paused .tvl video{animation-play-state:paused}
@keyframes tvkb{from{transform:scale(1)}to{transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){.tvl.kb img,.tvl.kb video{animation:none}.tvl{transition-duration:.6s}}
.tvcap{position:absolute;left:4vw;bottom:5vh;max-width:56vw;opacity:0;transition:opacity 1.2s ease;text-shadow:0 1px 14px rgba(0,0,0,.85)}
.tvcap b{display:block;font-family:var(--serif);font-weight:500;font-size:clamp(18px,2.1vw,34px);line-height:1.15}
.tvcap span{display:block;margin-top:8px;font-family:var(--mono);font-size:clamp(10px,.9vw,14px);letter-spacing:.2em;text-transform:uppercase;color:#c9d2db}
.tvsig{position:absolute;right:4vw;bottom:5vh;text-align:right;opacity:0;transition:opacity 1.2s ease;font-family:var(--mono);font-size:clamp(9px,.75vw,12px);letter-spacing:.24em;text-transform:uppercase;color:#c9d2db;text-shadow:0 1px 12px rgba(0,0,0,.85)}
.tvsig i{display:block;font-style:normal;margin-top:5px;color:var(--slate);letter-spacing:.12em;text-transform:none}
.tvp.capon .tvcap,.tvp.capon .tvsig{opacity:1}
.tvpause{position:absolute;top:4vh;right:4vw;display:none;gap:7px;padding:12px 14px;background:rgba(0,0,0,.5);border-radius:10px}
.tvpause i{display:block;width:7px;height:26px;background:var(--cloud);border-radius:2px}
.tvp.paused .tvpause{display:flex}
.tvload{position:absolute;top:50%;left:0;right:0;text-align:center;font-family:var(--mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--slate);display:none}
.tvp.loading .tvload{display:block}
.tvinfo{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}
.tvinfo[hidden]{display:none}
.tvinfo-in{max-width:760px;text-align:center}
.tvinfo h2{font-family:var(--serif);font-weight:500;font-size:clamp(30px,4vw,60px);margin:12px 0 10px;word-break:break-all}
.tvinfo .mono{font-family:var(--mono);font-size:clamp(12px,1.1vw,17px);letter-spacing:.14em;text-transform:uppercase;color:var(--cloud)}
.tvinfo .dim{color:var(--slate);font-size:12px;margin-top:28px;letter-spacing:.08em;text-transform:none}
.chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px}
.chips span{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--c,#8FA7AB);border-radius:999px;padding:8px 14px;font-family:var(--sans);font-size:clamp(13px,1vw,16px)}
.tvbar{position:absolute;left:50%;top:3vh;transform:translateX(-50%);display:flex;gap:6px;flex-wrap:wrap;justify-content:center;opacity:0;transition:opacity .4s;pointer-events:none;max-width:calc(100vw - 32px)}
.tvp.ui .tvbar{opacity:1;pointer-events:auto}
.tvbar button{background:rgba(8,13,22,.72);color:var(--cloud);border:1px solid rgba(236,232,221,.22);border-radius:999px;padding:9px 14px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.tvbar button:hover{border-color:var(--acid);color:var(--acid)}
"""

js = """<script src="assets/qrcode.min.js"></script>
<script>
(function(){
var tvL = document.getElementById('tvLogo');
if (tvL && window.NY_LOGOS) { var LL = window.NY_LOGOS.LOCKUPS; tvL.src = window.NY_LOGOS.url(LL[Math.floor(Math.random() * LL.length)]); tvL.hidden = false; }
'use strict';
var B = window.NY_BASE || '';
var SITE = __SITE__;
var $ = function(id){ return document.getElementById(id); };
var setup = $('tvSetup'), stage = $('tvStage');
var opts = { s: 20, shuffle: false, motion: true, captions: true };
var who = null;          /* the loaded collector json */
var whoKey = '';         /* what goes after the hash: ENS if known, else address */
var list = [], at = -1, timer = null, slotStart = 0, slotLeft = 0, paused = false, playing = false;
var layers = [$('tvA'), $('tvB')], front = 0, prepared = {}, token = 0;
var capTimer = null, idleTimer = null, uiTimer = null, wake = null, indexCache = null;

/* ---------- data ---------- */
function getJSON(url, ok, bad){
  var x = new XMLHttpRequest();
  x.open('GET', url, true);
  x.onreadystatechange = function(){
    if (x.readyState !== 4) return;
    if (x.status >= 200 && x.status < 300){
      var d = null; try { d = JSON.parse(x.responseText); } catch (e) { bad && bad(); return; }
      ok(d);
    } else { bad && bad(); }
  };
  try { x.send(); } catch (e) { bad && bad(); }
}
function loadIndex(cb){
  if (indexCache) return cb(indexCache);
  getJSON(B + 'api/c/index.json', function(d){ indexCache = d || {}; cb(indexCache); }, function(){ cb({}); });
}
function resolve(q, ok, bad){
  q = String(q || '').replace(/^\\s+|\\s+$/g, '').replace(/^@/, '').toLowerCase();
  try { q = decodeURIComponent(q); } catch (e) {}
  if (!q) return bad('Put in a wallet address or an ENS name.');
  function fetchAddr(a, name){
    getJSON(B + 'api/c/' + a + '.json', function(d){
      if (!d || !d.pieces) return bad('No New Yorkers found for ' + (name || a) + '.');
      ok(d);
    }, function(){ bad(name ? 'No New Yorkers found for ' + name + '. Try the 0x address.' : 'No New Yorkers found in that wallet. Check the address.'); });
  }
  if (/^0x[0-9a-f]{40}$/.test(q)) return fetchAddr(q);
  loadIndex(function(ix){
    var hit = null, k;
    for (k in ix){ if (ix.hasOwnProperty(k) && ix[k] && String(ix[k]).toLowerCase() === q){ hit = k; break; } }
    if (!hit && q.indexOf('.') < 0){
      for (k in ix){ if (ix.hasOwnProperty(k) && ix[k] && String(ix[k]).toLowerCase() === q + '.eth'){ hit = k; break; } }
    }
    if (!hit) return bad('No collector called ' + q + ' on the roll yet. Try the 0x address.');
    fetchAddr(hit.toLowerCase(), q);
  });
}
function nameOf(d){
  if (!d) return '';
  if (d.ens) return d.ens;
  return d.a ? d.a.slice(0, 6) + '...' + d.a.slice(-4) : '';
}
function keyOf(d){ return d.ens ? d.ens : d.a; }

/* ---------- hash ---------- */
function readHash(){
  var h = location.hash.replace(/^#/, ''), parts = h.split('&'), id = '', i, kv;
  for (i = 0; i < parts.length; i++){
    if (!parts[i]) continue;
    kv = parts[i].split('=');
    if (kv.length === 1 && !id){ id = kv[0]; continue; }
    if (kv[0] === 's'){ var n = parseInt(kv[1], 10); if (n >= 3 && n <= 3600) opts.s = n; }
    else if (kv[0] === 'shuffle') opts.shuffle = kv[1] === '1';
    else if (kv[0] === 'motion') opts.motion = kv[1] !== '0';
    else if (kv[0] === 'captions') opts.captions = kv[1] !== '0';
    else if ((kv[0] === 'w' || kv[0] === 'who') && kv[1]) id = kv[1];
  }
  try { id = decodeURIComponent(id); } catch (e) {}
  return id;
}
function hashFor(k){
  var h = k;
  if (opts.s !== 20) h += '&s=' + opts.s;
  if (opts.shuffle) h += '&shuffle=1';
  if (!opts.motion) h += '&motion=0';
  if (!opts.captions) h += '&captions=0';
  return h;
}
function publicUrl(k){ return SITE + '/tv#' + hashFor(k); }
function localUrl(k){ return location.href.split('#')[0] + '#' + hashFor(k); }

/* ---------- setup screen ---------- */
function syncForm(){
  $('tvSec').value = String(opts.s);
  if ($('tvSec').value !== String(opts.s)){
    var o = document.createElement('option'); o.value = String(opts.s); o.textContent = opts.s + ' seconds';
    $('tvSec').appendChild(o); $('tvSec').value = String(opts.s);
  }
  $('tvShuf').checked = opts.shuffle; $('tvCap').checked = opts.captions; $('tvMot').checked = opts.motion;
}
function readForm(){
  opts.s = parseInt($('tvSec').value, 10) || 20;
  opts.shuffle = $('tvShuf').checked; opts.captions = $('tvCap').checked; opts.motion = $('tvMot').checked;
}
function msg(t, cls){ var m = $('tvMsg'); m.textContent = t || ''; m.className = 'tvs-msg' + (cls ? ' ' + cls : ''); }
function drawQr(text){
  var c = $('tvQr'), g = c.getContext && c.getContext('2d');
  if (!g) return;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  if (!text || typeof qrcode !== 'function') return;
  var m;
  try { m = qrcode(0, 'M'); m.addData(text); m.make(); } catch (e) { return; }
  var n = m.getModuleCount(), quiet = 4, px = Math.floor(c.width / (n + quiet * 2)), off = Math.floor((c.width - px * n) / 2), x, y;
  g.fillStyle = '#080D16';
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (m.isDark(y, x)) g.fillRect(off + x * px, off + y * px, px, px);
}
function refreshShare(){
  if (who){
    var k = keyOf(who);
    $('tvShort').textContent = 'n3wyorkers.com/tv#' + k;
    drawQr(publicUrl(k));
    $('tvQrCap').textContent = publicUrl(k).replace(/^https?:\\/\\//, '');
  } else {
    $('tvShort').textContent = 'n3wyorkers.com/tv';
    drawQr(SITE + '/tv');
    $('tvQrCap').textContent = 'Put in a wallet to get its own code.';
  }
}
function countLine(d){
  var p = playable(d).length;
  return nameOf(d) + ': ' + p + ' New Yorker' + (p === 1 ? '' : 's') + ' to show.';
}
var lookTimer = null, lookSeq = 0;
function lookup(then){
  var q = $('tvWho').value, seq = ++lookSeq;
  if (!q.replace(/\\s/g, '')){ who = null; msg(''); refreshShare(); return; }
  msg('Looking...');
  resolve(q, function(d){
    if (seq !== lookSeq) return;
    who = d;
    if (!playable(d).length){ msg(nameOf(d) + ' holds no New Yorkers with a picture yet.', 'bad'); refreshShare(); return; }
    msg(countLine(d), 'ok'); refreshShare(); if (then) then();
  }, function(err){
    if (seq !== lookSeq) return;
    who = null; msg(err, 'bad'); refreshShare();
  });
}
$('tvWho').addEventListener('input', function(){ clearTimeout(lookTimer); lookTimer = setTimeout(function(){ lookup(); }, 450); });
['tvSec', 'tvShuf', 'tvCap', 'tvMot'].forEach(function(id){ $(id).addEventListener('change', function(){ readForm(); refreshShare(); }); });
$('tvForm').addEventListener('submit', function(e){
  e.preventDefault(); readForm();
  goFull();
  var q = $('tvWho').value;
  if (who && q && (q.toLowerCase().replace(/^\\s+|\\s+$/g, '') === String(who.ens || '').toLowerCase() || q.toLowerCase().replace(/^\\s+|\\s+$/g, '') === who.a)) return start();
  lookup(start);
});
if (window.PresentationRequest){
  $('tvCast').hidden = false;
  $('tvCast').addEventListener('click', function(){
    readForm();
    if (!who){ $('tvCastMsg').textContent = 'Put in a wallet first, so the TV knows whose New Yorkers to play.'; return; }
    $('tvCastMsg').textContent = 'Pick a TV in the window that opens.';
    try {
      var r = new PresentationRequest([publicUrl(keyOf(who))]);
      r.start().then(function(){ $('tvCastMsg').textContent = 'Casting. The frame is starting on the TV.'; },
        function(err){
          var n = err && err.name;
          $('tvCastMsg').textContent = n === 'NotAllowedError' || n === 'AbortError' ? 'Cast cancelled.' :
            n === 'NotFoundError' ? 'No TV found on this network. Try Cast in the Chrome menu, or open the link on the TV.' :
            'Casting did not start here. Try Cast in the Chrome menu, or open the link on the TV.';
        });
    } catch (e) { $('tvCastMsg').textContent = 'This browser cannot cast this page. Try Cast in the Chrome menu.'; }
  });
}

/* ---------- playlist ---------- */
function playable(d){
  var out = [], ps = (d && d.pieces) || [], i;
  for (i = 0; i < ps.length; i++) if (ps[i] && (ps[i].th || ps[i].big)) out.push(ps[i]);
  return out;
}
function shuffle(a){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pad(n){ n = String(n); while (n.length < 4) n = '0' + n; return n; }
function label(p){
  var kind = p.c === 'keystone' ? 'KEYSTONE' : 'CENSUS';
  var num = p.n != null ? 'NO. ' + pad(p.n) : (p.tok != null ? 'TOKEN ' + p.tok : '');
  return num ? num + ' \\u00b7 ' + kind : kind;
}
function src(u){ return /^https?:/.test(u) ? u : B + u; }

/* Prepare piece i: a promise of a ready element. Hi res first, the thumb if that fails or takes over 8s. */
function loadImg(urls, done){
  var k = 0;
  function next(){
    if (k >= urls.length) return done(null);
    var u = urls[k++], img = new Image(), fin = false;
    var t = setTimeout(function(){ if (fin) return; fin = true; img.onload = img.onerror = null; next(); }, k === 1 && urls.length > 1 ? 8000 : 20000);
    img.onload = function(){ if (fin) return; fin = true; clearTimeout(t); done(img); };
    img.onerror = function(){ if (fin) return; fin = true; clearTimeout(t); next(); };
    img.alt = '';
    img.src = u;
  }
  next();
}
function prepare(i, cb){
  var p = list[i];
  if (prepared[i]){
    if (prepared[i].el !== undefined) return cb && cb(prepared[i].el);
    if (cb) prepared[i].wait.push(cb);
    return;
  }
  var rec = prepared[i] = { el: undefined, wait: cb ? [cb] : [] };
  function finish(el){ rec.el = el; var w = rec.wait; rec.wait = []; for (var j = 0; j < w.length; j++) w[j](el); }
  var urls = []; if (p.big) urls.push(p.big); if (p.th) urls.push(src(p.th));
  function still(){ loadImg(urls, finish); }
  if (p.mv && opts.motion && document.createElement('video').canPlayType){
    var v = document.createElement('video'), fin = false;
    v.muted = true; v.loop = true; v.autoplay = false; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    if (p.th) v.poster = src(p.th);
    var t = setTimeout(function(){ if (fin) return; fin = true; v.removeAttribute('src'); still(); }, 8000);
    v.addEventListener('loadeddata', function(){ if (fin) return; fin = true; clearTimeout(t); finish(v); });
    v.addEventListener('error', function(){ if (fin) return; fin = true; clearTimeout(t); still(); });
    v.src = src(p.mv);
    try { v.load(); } catch (e) {}
  } else still();
}
function forget(keep){
  for (var k in prepared){
    if (!prepared.hasOwnProperty(k)) continue;
    if (keep.indexOf(+k) < 0 && prepared[k].el !== undefined){
      var el = prepared[k].el;
      if (el && el.tagName === 'VIDEO'){ try { el.pause(); } catch (e) {} }
      delete prepared[k];
    }
  }
}

/* ---------- the frame ---------- */
function start(){
  if (!who) return;
  list = playable(who);
  if (!list.length){ msg(nameOf(who) + ' holds no New Yorkers with a picture yet.', 'bad'); return; }
  if (opts.shuffle) shuffle(list);
  whoKey = keyOf(who);
  try { history.replaceState(null, '', '#' + hashFor(whoKey)); } catch (e) {}
  $('tvWhoName').textContent = nameOf(who);
  fillInfo();
  setup.hidden = true; stage.hidden = false; document.body.className += ' tv-on';
  prepared = {}; at = -1; paused = false; playing = true; stage.className = 'tvp loading';
  layers[0].className = layers[1].className = 'tvl'; layers[0].innerHTML = layers[1].innerHTML = '';
  askWake(); poke();
  show(0);
}
function stop(){
  playing = false; clearTimeout(timer); clearTimeout(capTimer); token++;
  for (var i = 0; i < 2; i++){ var v = layers[i].querySelector('video'); if (v) try { v.pause(); } catch (e) {} layers[i].innerHTML = ''; layers[i].className = 'tvl'; }
  forget([]);
  stage.hidden = true; setup.hidden = false; document.body.className = document.body.className.replace(/\\s*tv-on/g, '');
  $('tvInfo').hidden = true;
  if (wake && wake.release) { try { wake.release(); } catch (e) {} } wake = null;
  exitFull();
  if (who){ $('tvWho').value = keyOf(who); msg(countLine(who), 'ok'); }
  syncForm(); refreshShare();
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  setTimeout(function(){ try { $('tvStart').focus(); } catch (e) {} }, 50);
}
function cls(on, name){
  var c = ' ' + stage.className + ' ';
  if (on && c.indexOf(' ' + name + ' ') < 0) stage.className += ' ' + name;
  if (!on) stage.className = c.replace(' ' + name + ' ', ' ').replace(/^\\s+|\\s+$/g, '');
}
function show(i){
  if (!list.length) return;
  i = (i % list.length + list.length) % list.length;
  var my = ++token;
  clearTimeout(timer);
  if (at < 0) cls(true, 'loading');
  prepare(i, function(el){
    if (my !== token || !playing) return;
    cls(false, 'loading');
    if (!el){
      /* nothing loads for this one: drop it and move on, never stall */
      list.splice(i, 1); prepared = {};
      if (!list.length){ stop(); msg('None of these pictures would load. Check the connection and try again.', 'bad'); return; }
      return show(i >= list.length ? 0 : i);
    }
    put(i, el);
  });
}
function put(i, el){
  var p = list[i], back = 1 - front, L = layers[back], O = layers[front];
  at = i;
  if (el.parentNode && el.parentNode !== L){
    /* the same element is on the other layer (one piece list): clone it */
    el = el.cloneNode(true);
  }
  L.innerHTML = ''; L.className = 'tvl';
  L.style.setProperty && L.style.setProperty('--kb', (opts.s + 2) + 's');
  var origins = ['50% 50%', '30% 40%', '70% 40%', '40% 65%', '60% 60%'];
  el.style.transformOrigin = origins[i % origins.length];
  L.appendChild(el);
  void L.offsetWidth;
  L.className = 'tvl on kb';
  if (el.tagName === 'VIDEO'){ try { el.currentTime = 0; var pr = el.play(); if (pr && pr['catch']) pr['catch'](function(){}); } catch (e) {} }
  O.className = 'tvl';
  var oldv = O.querySelector('video');
  setTimeout(function(){ if (layers[1 - back] === O && O.className === 'tvl'){ if (oldv) try { oldv.pause(); } catch (e) {} O.innerHTML = ''; } }, 2300);
  front = back;
  caption(p);
  forget([i, (i + 1) % list.length, (i - 1 + list.length) % list.length]);
  prepare((i + 1) % list.length);
  slotLeft = opts.s * 1000;
  if (paused){ if (el.tagName === 'VIDEO') try { el.pause(); } catch (e) {} }
  else arm();
}
function arm(){ clearTimeout(timer); slotStart = Date.now(); timer = setTimeout(function(){ show(at + 1); }, slotLeft); }
function caption(p){
  $('tvCT').textContent = p.t || 'Untitled';
  $('tvCN').textContent = label(p);
  flashCap();
}
function flashCap(){
  clearTimeout(capTimer);
  if (!opts.captions){ cls(false, 'capon'); return; }
  cls(true, 'capon');
  capTimer = setTimeout(function(){ cls(false, 'capon'); }, 6000);
}
function togglePause(){
  if (!playing) return;
  paused = !paused;
  var v = layers[front].querySelector('video');
  if (paused){
    clearTimeout(timer); slotLeft = Math.max(1000, slotLeft - (Date.now() - slotStart));
    if (v) try { v.pause(); } catch (e) {}
    cls(true, 'paused'); $('tvBP').textContent = 'Play';
  } else {
    if (v) try { var pr = v.play(); if (pr && pr['catch']) pr['catch'](function(){}); } catch (e) {}
    cls(false, 'paused'); $('tvBP').textContent = 'Pause'; arm();
  }
}
function step(d){ if (!playing) return; paused = false; cls(false, 'paused'); $('tvBP').textContent = 'Pause'; show(at + d); }
function toggleCaptions(){ opts.captions = !opts.captions; flashCap(); try { history.replaceState(null, '', '#' + hashFor(whoKey)); } catch (e) {} }
function fillInfo(){
  var d = who;
  $('tvIName').textContent = nameOf(d) + (d.tag ? ' \\u00b7 ' + d.tag : '');
  var bits = [];
  if (d.rank) bits.push('Rank ' + d.rank + (d.of ? ' of ' + d.of : ''));
  if (d.pts != null) bits.push(d.pts + ' points');
  bits.push((d.census || 0) + ' census' + (d.keystone ? ', ' + d.keystone + ' keystone' : ''));
  $('tvIStats').textContent = bits.join(' \\u00b7 ');
  var box = $('tvIBadges'); box.innerHTML = '';
  var defs = d.badgeDefs || {}, bs = d.badges || [], i;
  for (i = 0; i < bs.length; i++){
    var b = defs[bs[i]]; if (!b) continue;
    var s = document.createElement('span');
    s.style.setProperty && s.style.setProperty('--c', b.color || '#8FA7AB');
    s.style.borderColor = b.color || '#8FA7AB';
    s.textContent = (b.icon ? b.icon + ' ' : '') + b.name;
    if (b.rule) s.title = b.rule;
    box.appendChild(s);
  }
}
function toggleInfo(){ $('tvInfo').hidden = !$('tvInfo').hidden; }

/* ---------- fullscreen, wake lock, idle ---------- */
function isFull(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function goFull(){
  var e = document.documentElement;
  try {
    var r = e.requestFullscreen ? e.requestFullscreen() : (e.webkitRequestFullscreen ? e.webkitRequestFullscreen() : null);
    if (r && r['catch']) r['catch'](function(){});
  } catch (x) {}
}
function exitFull(){
  if (!isFull()) return;
  try { var r = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen ? document.webkitExitFullscreen() : null); if (r && r['catch']) r['catch'](function(){}); } catch (x) {}
}
function fsLabel(){ $('tvBF').textContent = isFull() ? 'Exit full screen' : 'Full screen'; }
document.addEventListener('fullscreenchange', fsLabel); document.addEventListener('webkitfullscreenchange', fsLabel);
function askWake(){
  if (!playing || !navigator.wakeLock || !navigator.wakeLock.request) return;
  try { navigator.wakeLock.request('screen').then(function(l){ wake = l; }, function(){}); } catch (e) {}
}
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState !== 'visible' || !playing) return;
  askWake();
  /* Chrome pauses a muted clip while the tab is hidden; start it again when the frame is back */
  var v = layers[front].querySelector('video');
  if (v && !paused && v.paused){ try { var pr = v.play(); if (pr && pr['catch']) pr['catch'](function(){}); } catch (e) {} }
});
function poke(){
  cls(false, 'idle'); cls(true, 'ui');
  clearTimeout(idleTimer); clearTimeout(uiTimer);
  idleTimer = setTimeout(function(){ cls(true, 'idle'); cls(false, 'ui'); }, 3000);
}
stage.addEventListener('mousemove', poke);
stage.addEventListener('touchstart', poke);
$('tvBar').addEventListener('click', function(e){
  var t = e.target, a = t && t.getAttribute && t.getAttribute('data-a');
  if (!a) return;
  e.stopPropagation(); poke();
  if (a === 'prev') step(-1); else if (a === 'next') step(1); else if (a === 'pause') togglePause();
  else if (a === 'cap') toggleCaptions(); else if (a === 'info') toggleInfo();
  else if (a === 'fs'){ if (isFull()) exitFull(); else goFull(); }
  else if (a === 'exit') stop();
});
stage.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('#tvBar')) return; if (!$('tvInfo').hidden){ toggleInfo(); return; } poke(); });

/* remote controls: arrows, OK, media keys, and the Back key on LG (461) and Samsung (10009) */
document.addEventListener('keydown', function(e){
  if (!playing) return;
  var k = e.key, c = e.keyCode, hit = true;
  if (k === 'ArrowRight' || k === 'Right' || c === 39 || k === 'MediaTrackNext' || c === 176) step(1);
  else if (k === 'ArrowLeft' || k === 'Left' || c === 37 || k === 'MediaTrackPrevious' || c === 177) step(-1);
  else if (k === 'Enter' || k === ' ' || k === 'Spacebar' || c === 13 || c === 32 || k === 'MediaPlayPause' || c === 179 || c === 415 || c === 19) togglePause();
  else if (k === 'c' || k === 'C') toggleCaptions();
  else if (k === 'i' || k === 'I' || k === 'ArrowUp' || k === 'Up' || c === 38) toggleInfo();
  else if (k === 'ArrowDown' || k === 'Down' || c === 40){ if (!$('tvInfo').hidden) toggleInfo(); else flashCap(); }
  else if (k === 'f' || k === 'F'){ if (isFull()) exitFull(); else goFull(); }
  else if (k === 'Escape' || k === 'Esc' || c === 27 || c === 461 || c === 10009 || k === 'GoBack' || k === 'BrowserBack'){
    if (!$('tvInfo').hidden) toggleInfo(); else stop();
  }
  else hit = false;
  if (hit){ e.preventDefault(); poke(); }
});

/* ---------- boot ---------- */
var first = readHash();
syncForm(); refreshShare();
if (first){
  $('tvWho').value = first;
  msg('Looking...');
  resolve(first, function(d){
    who = d;
    if (!playable(d).length){ msg(nameOf(d) + ' holds no New Yorkers with a picture yet.', 'bad'); refreshShare(); return; }
    msg(countLine(d), 'ok'); refreshShare(); start();
  }, function(err){ msg(err, 'bad'); refreshShare(); });
} else {
  setTimeout(function(){ try { $('tvWho').focus(); } catch (e) {} }, 50);
}
window.addEventListener('hashchange', function(){
  var id = readHash(); syncForm();
  if (!id || (who && (id.toLowerCase() === String(who.ens || '').toLowerCase() || id.toLowerCase() === who.a))) return;
  if (playing) stop();
  $('tvWho').value = id; lookup(start);
});
})();
</script>""".replace("__SITE__", json.dumps(URL))

page = shell(title="The living frame · NEW YORKERS by MLow",
             description="Play a collector's NEW YORKERS full screen on a TV: one piece at a time, slow crossfades, a remote for a controller.",
             body=body, path="tv.html", active=None, noindex=True, extra_css=css, scripts_after=js)
open(os.path.join(SITE, "tv.html"), "w", encoding="utf-8").write(page)
print("tv.html: the living frame written")
