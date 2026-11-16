/* The title plate: the first thing a visitor sees inside a walkable gallery.
   build_galleries.py copies this beside each gallery's index.html and loads it with data-* attributes
   (title, kick, line, v). It lays full bleed key art (plate.webp, plate-p.webp on a tall screen) over the
   gallery's own intro, with the title, one line, and ENTER. ENTER presses the gallery's own #go button,
   so the gallery starts exactly as it always did; #goskate, where a gallery has one, becomes SKATE.
   The gallery's long intro is still there underneath: "About this gallery" lifts the plate to show it.
   If the gallery leaves its intro some other way (a deep link, a returning visitor) the plate leaves too.
   See HANDOFF_PLATES_2026-11-08.md. */
(function () {
  var me = document.currentScript, d = (me && me.dataset) || {};
  if (!d.title || /[?&]noplate\b/.test(location.search)) return;
  var v = d.v ? "?v=" + d.v : "";
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = "\
#ny-plate{position:fixed;inset:0;z-index:2147483000;background:#05070a;color:#F2EBDD;overflow:hidden;opacity:1;transition:opacity 1.1s ease,visibility 1.1s;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased}\
#ny-plate *{all:unset;box-sizing:border-box}#ny-plate div,#ny-plate h1,#ny-plate p{display:block}#ny-plate button{display:inline-block;text-align:center}#ny-plate b{font-weight:700}#ny-plate i{font-style:normal}\
#ny-plate.out{opacity:0;visibility:hidden;pointer-events:none}\
#ny-plate .nyp-art{position:absolute;inset:-1%;background:#05070a center/cover no-repeat;opacity:0;transform:scale(1.02);transition:opacity 2.2s ease}\
#ny-plate .nyp-art.in{opacity:1;animation:nyp-push 36s ease-out forwards}\
@keyframes nyp-push{from{transform:scale(1.02) translate3d(0,0,0)}to{transform:scale(1.06) translate3d(-.8%,-.6%,0)}}\
#ny-plate .nyp-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,7,10,.86) 0,rgba(5,7,10,.55) 34%,rgba(5,7,10,0) 66%),linear-gradient(0deg,rgba(5,7,10,.92) 0,rgba(5,7,10,.25) 38%,rgba(5,7,10,0) 60%),radial-gradient(ellipse at 60% 40%,transparent 50%,rgba(0,0,0,.45) 100%)}\
#ny-plate .nyp-grain{position:absolute;inset:-50%;opacity:.07;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");animation:nyp-grain .9s steps(4) infinite}\
@keyframes nyp-grain{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}100%{transform:translate(0,0)}}\
#ny-plate .nyp-bar{position:absolute;left:0;right:0;height:clamp(28px,6.5vh,64px);background:#05070a;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,56px);font:600 10px/1 Menlo,Consolas,monospace;letter-spacing:.32em;text-transform:uppercase;color:rgba(242,235,221,.62)}\
#ny-plate .nyp-bar.nyp-t{top:0}#ny-plate .nyp-bar.nyp-b{bottom:0}\
#ny-plate .nyp-bar i{font-style:normal;color:#F5C542}\
#ny-plate .nyp-lock{position:absolute;left:clamp(18px,6vw,96px);right:clamp(18px,6vw,96px);bottom:calc(clamp(28px,6.5vh,64px) + clamp(28px,7vh,80px));max-width:760px;opacity:0;transform:translateY(14px);transition:opacity 1.4s ease .5s,transform 1.4s cubic-bezier(.2,.7,.1,1) .5s}\
#ny-plate.ready .nyp-lock,#ny-plate.shown .nyp-lock{opacity:1;transform:none}\
#ny-plate .nyp-kick{font:600 11px/1 Menlo,Consolas,monospace;letter-spacing:.34em;text-transform:uppercase;color:#F5C542;display:flex;align-items:center;gap:14px}\
#ny-plate .nyp-kick:before{content:'';width:34px;height:1px;background:#F5C542}\
#ny-plate h1{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(38px,6.4vw,92px);line-height:.98;letter-spacing:.035em;margin:18px 0 16px;text-shadow:0 2px 40px rgba(0,0,0,.5);text-wrap:balance}\
#ny-plate .nyp-line{font-style:italic;font-size:clamp(16px,1.6vw,21px);line-height:1.5;color:rgba(242,235,221,.86);margin:0 0 30px;max-width:560px;text-wrap:pretty}\
#ny-plate .nyp-ways{display:flex;flex-wrap:wrap;align-items:center;gap:14px}\
#ny-plate button{font:700 11px/1 Menlo,Consolas,monospace;letter-spacing:.3em;text-transform:uppercase;border-radius:999px;padding:17px 34px 17px 36px;cursor:pointer;transition:background .3s,color .3s,box-shadow .3s,opacity .3s,transform .3s}\
#ny-plate .nyp-go{background:#F2EBDD;color:#0b0d12;border:1px solid #F2EBDD;box-shadow:0 14px 50px rgba(0,0,0,.45)}\
#ny-plate .nyp-go:hover{background:#F5C542;border-color:#F5C542;transform:translateY(-1px)}\
#ny-plate .nyp-sk{background:rgba(5,7,10,.35);color:#F2EBDD;border:1px solid rgba(242,235,221,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}\
#ny-plate .nyp-sk:hover{border-color:#F2EBDD}\
#ny-plate button:disabled{opacity:.45;cursor:wait;transform:none}\
#ny-plate .nyp-load{margin-top:22px;width:200px;height:1px;background:rgba(242,235,221,.18);position:relative;overflow:hidden;transition:opacity .8s}\
#ny-plate .nyp-load b{position:absolute;left:0;top:0;bottom:0;width:0;background:#F5C542;transition:width .4s}\
#ny-plate .nyp-load.nyp-idle b{width:30%;animation:nyp-slide 1.6s ease-in-out infinite}\
@keyframes nyp-slide{from{left:-30%}to{left:100%}}\
#ny-plate.ready .nyp-load{opacity:0}\
#ny-plate .nyp-more{background:none;border:0;padding:0;margin-left:10px;color:rgba(242,235,221,.6);letter-spacing:.24em;font-size:10px;border-bottom:1px solid rgba(242,235,221,.25);border-radius:0;padding-bottom:4px}\
#ny-plate .nyp-more:hover{color:#F2EBDD}\
#ny-plate .nyp-stats{position:absolute;right:clamp(16px,4vw,56px);bottom:calc(clamp(28px,6.5vh,64px) + clamp(28px,7vh,80px));text-align:right;font:600 10px/2.1 Menlo,Consolas,monospace;letter-spacing:.28em;text-transform:uppercase;color:rgba(242,235,221,.6);opacity:0;transition:opacity 1.4s ease 1s}\
#ny-plate.ready .nyp-stats{opacity:1}\
#ny-plate .nyp-stats b{color:#F2EBDD;font-weight:600;margin-right:.6em}\
@media (max-width:900px){#ny-plate .nyp-stats{display:none}}\
@media (max-width:640px),(max-aspect-ratio:4/5){#ny-plate .nyp-shade{background:linear-gradient(0deg,rgba(5,7,10,.95) 0,rgba(5,7,10,.7) 38%,rgba(5,7,10,0) 70%),radial-gradient(ellipse at 50% 30%,transparent 50%,rgba(0,0,0,.4) 100%)}\
#ny-plate .nyp-bar span:last-child{display:none}#ny-plate .nyp-bar{justify-content:center}\
#ny-plate .nyp-lock{bottom:calc(clamp(28px,6.5vh,64px) + 22px)}#ny-plate .nyp-line{margin-bottom:22px}\
#ny-plate button{padding:15px 24px 15px 26px;letter-spacing:.24em}#ny-plate .nyp-more{width:100%;text-align:left;margin:6px 0 0;padding-bottom:3px;border:0}}\
@media (max-height:520px){#ny-plate h1{font-size:clamp(28px,7vh,48px);margin:10px 0 8px}#ny-plate .nyp-line{margin-bottom:14px;font-size:14px}#ny-plate .nyp-lock{bottom:calc(clamp(28px,6.5vh,64px) + 14px)}#ny-plate .nyp-bar{height:26px}}\
@media (prefers-reduced-motion:reduce){#ny-plate .nyp-art.in,#ny-plate .nyp-grain,#ny-plate .nyp-load.nyp-idle b{animation:none}}";
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mount() {
    if (document.getElementById("ny-plate")) return;
    var st = el("style"); st.id = "ny-plate-css"; st.textContent = css; document.head.appendChild(st);
    var P = el("div"); P.id = "ny-plate"; P.setAttribute("role", "dialog"); P.setAttribute("aria-label", d.title);
    var tall = matchMedia("(max-aspect-ratio: 4/5)").matches;
    var art = el("div", "nyp-art"), img = new Image();
    img.onload = function () { art.style.backgroundImage = "url(" + img.src + ")"; art.classList.add("in"); };
    img.src = (tall ? "plate-p.webp" : "plate.webp") + v;
    P.appendChild(art); P.appendChild(el("div", "nyp-shade"));
    if (!RM) P.appendChild(el("div", "nyp-grain"));
    P.appendChild(el("div", "nyp-bar nyp-t", "<span>N3W YORKERS <i>by</i> MLow</span><span>" + esc(d.kind || "n3wyorkers.com") + "</span>"));
    P.appendChild(el("div", "nyp-bar nyp-b", "<span>Free in your browser</span><span>" + esc(d.hint || "Best with sound on") + "</span>"));
    var lock = el("div", "nyp-lock");
    lock.innerHTML = '<div class="nyp-kick">' + esc(d.kick || "A walkable gallery by MLow") + "</div><h1>" + esc(d.title) + "</h1>" +
      (d.line ? '<p class="nyp-line">' + esc(d.line) + "</p>" : "") +
      '<div class="nyp-ways"><button class="nyp-go" type="button" disabled>Enter</button></div><div class="nyp-load nyp-idle"><b></b></div>';
    P.appendChild(lock);
    var stats = el("div", "nyp-stats"); P.appendChild(stats);
    document.body.appendChild(P);
    requestAnimationFrame(function () { P.classList.add("shown"); });
    var bGo = lock.querySelector(".nyp-go"), ways = lock.querySelector(".nyp-ways"), load = lock.querySelector(".nyp-load"), bar = load.querySelector("b");
    var bSk = null, bMore = null, ready = false, seen = false, gone = false, t0 = Date.now();
    function go() { return document.getElementById("go"); }
    function sk() { return document.getElementById("goskate"); }
    function shown(e) { return !!(e && e.getClientRects().length); }
    function cover(e) {   // the gallery's own intro: the fixed layer that holds its #go
      for (var n = e; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === "fixed") return n;
      return null;
    }
    function off(e) { if (!e) return true; var s = getComputedStyle(e); return s.display === "none" || s.visibility === "hidden" || +s.opacity < .05; }
    function leave() { if (gone) return; gone = true; P.classList.add("out"); setTimeout(function () { P.remove(); }, 1300); clearInterval(tick); }
    function press(btn) {
      if (!btn || btn.disabled) return;
      btn.click();   // inside this click, so the gallery keeps the user gesture it needs for sound and pointer lock
      leave();
    }
    bGo.addEventListener("click", function () { var g = go(); if (g && shown(g)) press(g); else if (!g) leave(); });
    function stat() {   // the gallery's own numbers, filled in by its engine, so they never drift
      var s = document.querySelectorAll("#intro .stats span"); if (!s.length) return;
      var h = ""; for (var i = 0; i < s.length && i < 4; i++) {
        var b = s[i].querySelector("b"), n = b ? b.textContent.trim() : "", rest = s[i].textContent.replace(n, "").trim();
        if (!n || n === "0") continue; h += "<div><b>" + esc(n) + "</b>" + esc(rest) + "</div>";
      }
      stats.innerHTML = h;
    }
    var tick = setInterval(function () {
      var g = go();
      if (!g) { if (Date.now() - t0 > 4000 && !ready) { ready = true; bGo.disabled = false; P.classList.add("ready"); } return; }
      var c = cover(g), vis = shown(g) && !off(c);
      if (vis) seen = true;
      if (seen && !vis && !g.disabled) { leave(); return; }   // the gallery went in without us
      var lp = document.getElementById("lp");
      if (lp && lp.style.width) { load.classList.remove("nyp-idle"); bar.style.width = lp.style.width; }
      if (!ready && vis && !g.disabled) {
        ready = true; bGo.disabled = false; P.classList.add("ready"); stat();
        var s = sk();
        if (s && !bSk) { bSk = el("button", "nyp-sk", "Skate it"); bSk.type = "button"; ways.appendChild(bSk); bSk.addEventListener("click", function () { press(sk()); }); }
        if (c && !bMore) {
          bMore = el("button", "nyp-more", "About this gallery"); bMore.type = "button"; ways.appendChild(bMore);
          bMore.addEventListener("click", function () { leave(); });
        }
        try { bGo.focus({ preventScroll: true }); } catch (e) {}
      }
      if (ready && bSk) bSk.disabled = !sk() || sk().disabled;
      if (ready) stat();
    }, 250);
    document.addEventListener("keydown", function (e) { if (!gone && ready && e.key === "Enter" && document.activeElement !== bGo) { e.preventDefault(); bGo.click(); } }, true);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
