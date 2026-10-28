#!/usr/bin/env python3
"""media.html: THE SCREENING ROOM, built as a New York movie palace from _build/media.json, newest first.

The lead film runs edge to edge under a lit marquee of changeable letters; every other film is a numbered
poster in the programme with a paper ticket stub (admit one, runtime, the door to its gallery). Posters
play their silent 12 s teaser on hover or when centred on a phone. Any play button opens the theater: the
room goes dark and the HLS master plays with sound (hls.js where the browser has no native HLS).

To add a film: an entry in media.json, `python3 add_media.py <slug>`, then this, then build_seo.py (VideoObject,
sitemap) and build_og.py (build_seo strips the og cards it does not own).
Redesigned 2026-10-20 on MLow's ask ("much better and more premium"); the first version is in git history.
"""
import json, os, re, html
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
URL = cfg()["siteUrl"]
FILMS = json.load(open(os.path.join(HERE, "media.json")))["films"]
E = html.escape


def secs(slug):
    try: return round(sum(float(x) for x in re.findall(r"#EXTINF:([\d.]+)", open(os.path.join(SITE, "assets", "film", slug, "720", "index.m3u8")).read())))
    except OSError: return None
def mmss(s): return f"{s // 60}:{s % 60:02d}" if s else ""


for F in FILMS:
    d = os.path.join(SITE, "assets", "film", F["slug"])
    for x in ("master.m3u8", "poster.jpg"):
        if not os.path.exists(os.path.join(d, x)): raise SystemExit(f"media: assets/film/{F['slug']} is missing {x}; run add_media.py {F['slug']}")
    F["sec"] = secs(F["slug"])
    F["has_teaser"] = os.path.exists(os.path.join(d, "teaser.mp4"))


def attrs(F):
    t = f' data-teaser="assets/film/{F["slug"]}/teaser.mp4"' if F["has_teaser"] else ""
    return (f'data-slug="{F["slug"]}" data-src="assets/film/{F["slug"]}/master.m3u8" data-title="{E(F["title"])}" '
            f'data-kick="{E(F["kick"])}" data-link="{E(F.get("link") or "")}" data-link-label="{E(F.get("link_label") or "")}"{t}')


def door(F, cls="btn ghost"):
    return f'<a class="{cls}" href="{F["link"]}">{F["link_label"]}</a>' if F.get("link") else ""


# ---------------- the lead, edge to edge ----------------
L = FILMS[0]
lead = f"""
  <section class="mx-lead" id="{L['slug']}" {attrs(L)}>
    <div class="mx-lead-pic">
      <img src="assets/film/{L['slug']}/poster.jpg" alt="" width="1280" height="720" fetchpriority="high">
      <video class="mx-tease" muted loop playsinline preload="none" aria-hidden="true"></video>
    </div>
    <div class="mx-lead-copy">
      <div class="mx-now"><span class="mx-dot"></span>Now showing</div>
      <h1 class="mx-title">{L['title']}</h1>
      <div class="mx-meta">{L['kick']}<span>·</span>{mmss(L['sec'])}</div>
      <p class="mx-blurb">{L['blurb']}</p>
      <div class="mx-ctas">
        <button class="btn mx-play" type="button" data-play="{L['slug']}"><i class="mx-tri" aria-hidden="true"></i>Play the film<b>{mmss(L['sec'])}</b></button>
        {door(L)}
      </div>
    </div>
  </section>"""

# ---------------- the marquee: changeable letters on a lit board ----------------
def letters(s):
    return "".join('<i class="sp"></i>' if c == " " else f"<i>{E(c)}</i>" for c in s.upper())


names = "  ✦  ".join(F["title"] for F in FILMS)
marquee = f"""
  <div class="mx-marquee" aria-label="Now showing: {E(', '.join(F['title'] for F in FILMS))}">
    <div class="mx-bulbs top" aria-hidden="true"></div>
    <div class="mx-board" aria-hidden="true"><div class="mx-run">
      <span class="mx-letters">{letters('THE SCREENING ROOM  ✦  ' + names + '  ✦  ')}</span><span class="mx-letters">{letters('THE SCREENING ROOM  ✦  ' + names + '  ✦  ')}</span>
    </div></div>
    <div class="mx-bulbs bot" aria-hidden="true"></div>
  </div>"""

# ---------------- the programme ----------------
cards = []
for n, F in enumerate(FILMS[1:], start=2):
    cards.append(f"""
    <article class="mx-card" id="{F['slug']}" {attrs(F)}>
      <button class="mx-poster" type="button" data-play="{F['slug']}" aria-label="Play {E(F['title'])} with sound, {mmss(F['sec'])}">
        <img src="assets/film/{F['slug']}/poster.jpg" alt="" loading="lazy" width="1280" height="720">
        <video class="mx-tease" muted loop playsinline preload="none" aria-hidden="true"></video>
        <span class="mx-no" aria-hidden="true">{n:02d}</span>
        <span class="mx-glyph" aria-hidden="true"><i class="mx-tri"></i></span>
        <span class="mx-run-time">{mmss(F['sec'])}</span>
      </button>
      <div class="mx-stub">
        <div class="mx-admit" aria-hidden="true">Admit one</div>
        <div class="mx-stub-body">
          <div class="mx-kick">{F['kick']}</div>
          <h2>{F['title']}</h2>
          <p>{F['blurb']}</p>
          <div class="mx-stub-row">{door(F, 'mx-door')}<a class="mx-deep" href="media#{F['slug']}" title="Link to this film">#{F['slug']}</a></div>
        </div>
      </div>
    </article>""")

body = f"""
<main class="mx">
{lead}
{marquee}
  <section class="mx-programme" aria-labelledby="mx-prog-h">
    <header class="mx-prog-hd">
      <div class="kicker">The programme</div>
      <h2 id="mx-prog-h">Every film, newest first</h2>
      <p>Trailers, spots and highlights from NEW YORKERS. Each one has a door to the gallery it was shot in, and every gallery is free to walk.</p>
    </header>
    <div class="mx-grid">{''.join(cards)}
    </div>
  </section>
  <p class="mx-under">Made by MLow in New York.</p>
</main>
<dialog class="mx-theater" aria-label="Theater">
  <div class="mx-th-in">
    <div class="mx-th-top"><div class="mx-th-kick"></div><button class="mx-th-x" type="button" aria-label="Close the theater">Close <kbd>esc</kbd></button></div>
    <div class="mx-th-screen"><video class="mx-th-v" playsinline controls></video></div>
    <div class="mx-th-bot"><h2 class="mx-th-title"></h2><a class="btn ghost mx-th-door" href="#"></a></div>
  </div>
</dialog>"""

css = r"""
.mx{--mx-pad:clamp(16px,4vw,56px);padding:0 0 72px;overflow-x:clip}
.mx .btn{white-space:nowrap}
/* ---------- the lead: the film, edge to edge ---------- */
.mx-lead{position:relative;min-height:min(86vh,62vw);display:grid;align-items:end;isolation:isolate;margin-bottom:0}
.mx-lead-pic{position:absolute;inset:0;z-index:-1;overflow:hidden;background:#000}
.mx-lead-pic img,.mx-lead-pic video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mx-lead-pic video{opacity:0;transition:opacity .9s ease}
.mx-lead-pic video.on{opacity:1}
.mx-lead-pic:after{content:"";position:absolute;inset:0;background:
  linear-gradient(90deg,rgba(8,13,22,.92) 0%,rgba(8,13,22,.62) 34%,rgba(8,13,22,0) 64%),
  linear-gradient(0deg,var(--ink,#080D16) 0%,rgba(8,13,22,.55) 26%,rgba(8,13,22,0) 52%),
  linear-gradient(180deg,rgba(8,13,22,.55) 0%,rgba(8,13,22,0) 18%)}
.mx-lead-copy{padding:0 var(--mx-pad) clamp(40px,7vh,84px);max-width:760px;text-align:left}
.mx-now{display:inline-flex;align-items:center;gap:10px;font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.28em;text-transform:uppercase;color:var(--gold,#ECC981)}
.mx-dot{width:8px;height:8px;border-radius:50%;background:var(--coral,#DC6F57);box-shadow:0 0 0 3px rgba(220,111,87,.22),0 0 14px rgba(220,111,87,.8);animation:mxrec 1.6s ease-in-out infinite}
@keyframes mxrec{50%{opacity:.35}}
.mx-title{font-family:Fraunces,Georgia,serif;font-weight:800;font-size:clamp(46px,8.2vw,124px);line-height:.9;letter-spacing:-.035em;margin:18px 0 16px;color:var(--cloud,#ECE8DD);text-wrap:balance;text-shadow:0 10px 60px rgba(0,0,0,.5)}
.mx-meta{font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--slate,#8FA7AB)}
.mx-meta span{margin:0 .7em;color:var(--gold,#ECC981)}
.mx-blurb{font-family:Fraunces,Georgia,serif;font-size:clamp(17px,1.5vw,20px);line-height:1.55;color:rgba(236,232,221,.88);margin:22px 0 30px;max-width:58ch}
.mx-ctas{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.mx-play{display:inline-flex;align-items:center;gap:12px}
.mx-play b{font-weight:600;opacity:.6;margin-left:4px;font-family:'IBM Plex Mono',monospace;letter-spacing:.06em}
.mx-tri{display:inline-block;width:0;height:0;border-left:11px solid currentColor;border-top:7px solid transparent;border-bottom:7px solid transparent}
/* ---------- the marquee ---------- */
.mx-marquee{position:relative;margin:0 0 clamp(56px,8vw,104px);background:linear-gradient(#1b1208,#0e0904);padding:12px 0;box-shadow:0 1px 0 rgba(236,201,129,.28) inset,0 -1px 0 rgba(236,201,129,.2) inset,0 30px 60px -30px rgba(0,0,0,.9)}
.mx-bulbs{height:12px;margin:0 6px;background:radial-gradient(circle at 50% 50%,#FFE2A6 0 2.6px,#E7A64F 3.4px,rgba(231,166,79,.25) 4.6px,transparent 6px) 0 50%/24px 12px repeat-x;animation:mxchase 1.4s steps(2) infinite}
.mx-bulbs.bot{animation-delay:-.7s}
@keyframes mxchase{50%{filter:brightness(.45)}}
.mx-board{margin:8px 0;background:linear-gradient(180deg,#fbf6ea,#efe5cd 55%,#e6d9bb);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),inset 0 10px 24px rgba(255,255,255,.6),inset 0 -12px 22px rgba(120,90,40,.25),0 0 50px rgba(236,201,129,.22);overflow:hidden;padding:9px 0}
.mx-run{display:flex;width:max-content;animation:mxrun 90s linear infinite}
.mx-letters{display:flex;gap:4px;padding-right:4px}
.mx-letters i{font:normal 800 clamp(20px,2.2vw,30px)/1 'Helvetica Neue',Helvetica,Arial,sans-serif;color:#141210;width:1.02em;height:1.34em;display:grid;place-items:center;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0) 60%);border-radius:2px;box-shadow:0 1px 0 rgba(0,0,0,.18),inset 0 0 0 1px rgba(0,0,0,.06)}
.mx-letters i.sp{background:none;box-shadow:none;width:.5em}
@keyframes mxrun{to{transform:translateX(-50%)}}
/* ---------- the programme ---------- */
.mx-programme{padding:0 var(--mx-pad);max-width:1320px;margin:0 auto}
.mx-prog-hd{max-width:720px;margin:0 0 44px;text-align:left}
.mx-prog-hd h2{text-wrap:balance;font-family:Fraunces,Georgia,serif;font-weight:700;font-size:clamp(32px,4.4vw,58px);line-height:1;letter-spacing:-.02em;margin:14px 0 14px}
.mx-prog-hd p{font-family:Fraunces,Georgia,serif;font-style:italic;font-size:clamp(16px,1.4vw,19px);color:var(--slate,#8FA7AB);margin:0;line-height:1.55}
.mx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(36px,4vw,60px) clamp(24px,3vw,44px)}
.mx-card{margin:0;text-align:left;scroll-margin-top:90px;display:flex;flex-direction:column}
.mx-poster{all:unset;box-sizing:border-box;cursor:pointer;display:block;position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:6px 6px 0 0;background:#000;
  box-shadow:0 0 0 1px rgba(236,201,129,.18),0 40px 80px -36px rgba(0,0,0,.95);transform:translateZ(0);transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s}
.mx-poster img,.mx-poster video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .6s ease,transform 1.2s cubic-bezier(.16,1,.3,1)}
.mx-poster video{opacity:0}
.mx-poster video.on{opacity:1}
.mx-poster:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,13,22,.7),rgba(8,13,22,0) 45%),radial-gradient(120% 80% at var(--mx,50%) var(--my,30%),rgba(255,236,190,.14),transparent 60%);pointer-events:none}
.mx-poster:hover,.mx-poster:focus-visible{transform:translateY(-4px);box-shadow:0 0 0 1px rgba(236,201,129,.55),0 50px 90px -34px rgba(0,0,0,1)}
.mx-poster:hover img,.mx-poster:hover video{transform:scale(1.035)}
.mx-poster:focus-visible{outline:2px solid var(--gold,#ECC981);outline-offset:4px}
.mx-no{position:absolute;left:18px;bottom:10px;z-index:2;font:italic 700 clamp(40px,4.6vw,64px)/1 Fraunces,Georgia,serif;color:rgba(236,232,221,.92);letter-spacing:-.04em;text-shadow:0 4px 24px rgba(0,0,0,.6)}
.mx-glyph{position:absolute;left:50%;top:50%;z-index:2;width:74px;height:74px;margin:-37px 0 0 -37px;border-radius:50%;display:grid;place-items:center;color:#141210;
  background:radial-gradient(circle at 35% 30%,#fff3cf,#ECC981 55%,#b98a3c);box-shadow:0 14px 40px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.7);opacity:0;transform:scale(.8);transition:opacity .35s,transform .45s cubic-bezier(.16,1,.3,1)}
.mx-glyph .mx-tri{border-left-width:16px;border-top-width:10px;border-bottom-width:10px;margin-left:5px}
.mx-poster:hover .mx-glyph,.mx-poster:focus-visible .mx-glyph{opacity:1;transform:scale(1)}
.mx-run-time{position:absolute;right:14px;bottom:14px;z-index:2;font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.12em;color:var(--cloud,#ECE8DD);background:rgba(8,13,22,.72);padding:7px 9px;border-radius:3px;backdrop-filter:blur(6px)}
/* the stub: paper, perforated where it tears off the poster */
.mx-stub{flex:1;position:relative;display:grid;grid-template-columns:auto 1fr;background:linear-gradient(180deg,#f2ead7,#e9dfc6);color:#1a1712;border-radius:0 0 6px 6px;
  -webkit-mask:radial-gradient(circle 9px at 0 0,#0000 98%,#000) top left/51% 100% no-repeat,radial-gradient(circle 9px at 100% 0,#0000 98%,#000) top right/51% 100% no-repeat;
  mask:radial-gradient(circle 9px at 0 0,#0000 98%,#000) top left/51% 100% no-repeat,radial-gradient(circle 9px at 100% 0,#0000 98%,#000) top right/51% 100% no-repeat;
  box-shadow:0 30px 60px -30px rgba(0,0,0,.9)}
.mx-stub:before{content:"";position:absolute;left:14px;right:14px;top:0;border-top:2px dotted rgba(26,23,18,.35)}
.mx-admit{writing-mode:vertical-rl;transform:rotate(180deg);font:600 10px/1 'IBM Plex Mono',monospace;letter-spacing:.32em;text-transform:uppercase;color:#7a5d2c;padding:20px 12px;border-right:1px dashed rgba(26,23,18,.28)}
.mx-stub-body{padding:20px 22px 20px 20px;min-width:0;display:flex;flex-direction:column}
.mx-stub-row{margin-top:auto}
.mx-kick{font:500 11px/1.3 'IBM Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a5a2b}
.mx-stub h2{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:clamp(22px,2.2vw,30px);line-height:1.05;letter-spacing:-.01em;margin:8px 0 10px;color:#141210}
.mx-stub p{font-family:Fraunces,Georgia,serif;font-size:15px;line-height:1.55;color:#3d362b;margin:0 0 14px}
.mx-stub-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid rgba(26,23,18,.14);padding-top:12px}
.mx-door{font:700 12px/1 'Space Grotesk',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#141210;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.mx-door:after{content:"";width:22px;height:1.5px;background:currentColor;transition:width .35s cubic-bezier(.16,1,.3,1)}
.mx-door:hover:after{width:40px}
.mx-deep{font:500 11px/1 'IBM Plex Mono',monospace;color:#8f8371;text-decoration:none;letter-spacing:.04em}
.mx-deep:hover{color:#141210}
.mx-under{text-align:center;margin:72px auto 0;font:italic 400 18px/1.5 Fraunces,Georgia,serif;color:var(--slate,#8FA7AB)}
/* ---------- the theater ---------- */
.mx-theater{border:0;padding:0;margin:0;width:100vw;height:100vh;max-width:none;max-height:none;background:transparent;color:var(--cloud,#ECE8DD)}
.mx-theater::backdrop{background:radial-gradient(70% 60% at 50% 0%,rgba(236,201,129,.10),transparent 70%),rgba(4,6,10,.96);backdrop-filter:blur(6px)}
.mx-th-in{height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:14px;padding:clamp(12px,3vw,32px) clamp(12px,4vw,56px);box-sizing:border-box}
.mx-th-top,.mx-th-bot{display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:1500px;width:100%;margin:0 auto}
.mx-th-kick{font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:var(--gold,#ECC981)}
.mx-th-x{all:unset;cursor:pointer;font:600 12px/1 'Space Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--cloud,#ECE8DD);display:inline-flex;align-items:center;gap:10px;padding:10px 4px}
.mx-th-x kbd{font:500 10px/1 'IBM Plex Mono',monospace;border:1px solid rgba(236,232,221,.35);border-radius:3px;padding:4px 6px;color:var(--slate,#8FA7AB)}
.mx-th-x:hover{color:var(--gold,#ECC981)}
.mx-th-screen{display:grid;place-items:center;min-height:0}
.mx-th-v{max-width:min(1500px,100%);max-height:100%;width:100%;aspect-ratio:16/9;background:#000;border-radius:4px;box-shadow:0 0 0 1px rgba(236,201,129,.35),0 60px 160px rgba(0,0,0,.9),0 0 120px rgba(236,201,129,.08)}
.mx-th-title{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:clamp(22px,2.6vw,36px);margin:0;letter-spacing:-.01em}
.mx-th-door:empty{display:none}
html.mx-dark{overflow:hidden}
/* ---------- phones ---------- */
@media (max-width:900px){.mx-grid{grid-template-columns:1fr}}
@media (max-width:760px){
  .mx-lead{min-height:auto;display:block}
  .mx-lead-pic{position:relative;aspect-ratio:16/10;inset:auto}
  .mx-lead-pic:after{background:linear-gradient(0deg,var(--ink,#080D16) 0%,rgba(8,13,22,0) 55%)}
  .mx-lead-copy{padding:0 16px 8px;margin-top:-34px;position:relative}
  .mx-title{font-size:clamp(40px,12vw,58px);margin:12px 0 12px}
  .mx-blurb{font-size:16px;margin:16px 0 22px}
  .mx-ctas .btn{flex:1 1 auto;justify-content:center}
  .mx-marquee{margin-top:40px}
  .mx-glyph{opacity:.95;transform:scale(.85)}
  .mx-stub-body{padding:16px 16px 16px 14px}
  .mx-admit{padding:16px 9px}
}
@media (prefers-reduced-motion:reduce){
  .mx-run,.mx-bulbs,.mx-dot{animation:none}.mx-poster,.mx-poster img,.mx-glyph,.mx-lead-pic video{transition:none}
}
"""

scripts_after = """<script>
(function(){
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches, FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var HLSJS = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js", loading = null;
  function hls(cb){ if (window.Hls) return cb(); if (!loading) { loading = new Promise(function(res, rej){ var s = document.createElement("script"); s.src = HLSJS; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); } loading.then(cb, cb); }
  function tease(box, on){ var v = box.querySelector("video.mx-tease"); if (!v || !box.dataset.teaser || RM) return;
    if (on) { if (!v.src) v.src = box.dataset.teaser; v.play().then(function(){ v.classList.add("on"); }).catch(function(){}); }
    else { v.pause(); v.classList.remove("on"); } }
  // the lead loops its teaser while it is on screen
  var lead = document.querySelector(".mx-lead");
  if (lead && "IntersectionObserver" in window) new IntersectionObserver(function(es){ es.forEach(function(e){ tease(lead, e.isIntersecting); }); }, {threshold: .25}).observe(lead);
  // programme posters: hover on a desktop, the one in the middle of the screen on a phone
  var cards = [].slice.call(document.querySelectorAll(".mx-card"));
  cards.forEach(function(c){ var p = c.querySelector(".mx-poster");
    if (FINE) { p.addEventListener("pointerenter", function(){ tease(c, true); }); p.addEventListener("pointerleave", function(){ tease(c, false); });
      p.addEventListener("pointermove", function(e){ var r = p.getBoundingClientRect(); p.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); p.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); }); }
  });
  if (!FINE && "IntersectionObserver" in window) { var io = new IntersectionObserver(function(es){ es.forEach(function(e){ tease(e.target, e.isIntersecting); }); }, {rootMargin: "-38% 0px -38% 0px"}); cards.forEach(function(c){ io.observe(c); }); }
  // the theater
  var dlg = document.querySelector(".mx-theater"), tv = dlg.querySelector(".mx-th-v"), hl = null;
  function film(slug){ return document.querySelector('[data-slug="' + slug + '"]'); }
  function open(slug){ var f = film(slug); if (!f) return;
    document.querySelectorAll("video.mx-tease").forEach(function(v){ v.pause(); });
    dlg.querySelector(".mx-th-kick").textContent = f.dataset.kick; dlg.querySelector(".mx-th-title").textContent = f.dataset.title;
    var d = dlg.querySelector(".mx-th-door"); d.textContent = f.dataset.linkLabel || ""; d.href = f.dataset.link || "#";
    tv.poster = "assets/film/" + slug + "/poster.jpg";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); document.documentElement.classList.add("mx-dark");
    if (history.replaceState) history.replaceState(null, "", "media#" + slug);
    var SRC = f.dataset.src, go = function(){ tv.muted = false; tv.play().catch(function(){}); };
    if (tv.canPlayType("application/vnd.apple.mpegurl")) { tv.src = SRC; go(); return; }
    hls(function(){ if (window.Hls && Hls.isSupported()) { hl = new Hls({capLevelToPlayerSize: true}); hl.loadSource(SRC); hl.attachMedia(tv); hl.on(Hls.Events.MANIFEST_PARSED, go); } else { tv.src = SRC; go(); } });
  }
  function shut(){ tv.pause(); if (hl) { hl.destroy(); hl = null; } tv.removeAttribute("src"); tv.load(); document.documentElement.classList.remove("mx-dark"); if (dlg.open && dlg.close) dlg.close(); else dlg.removeAttribute("open");
    if (lead) { var r = lead.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) tease(lead, true); } }
  document.addEventListener("click", function(e){ var b = e.target.closest("[data-play]"); if (b) { e.preventDefault(); open(b.dataset.play); } });
  dlg.querySelector(".mx-th-x").addEventListener("click", shut);
  dlg.addEventListener("close", function(){ if (document.documentElement.classList.contains("mx-dark")) shut(); });
  dlg.addEventListener("click", function(e){ if (e.target === dlg || e.target.classList.contains("mx-th-in") || e.target.classList.contains("mx-th-screen")) shut(); });
  // media#slug scrolls to that film
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function(){ t.scrollIntoView({block: "start"}); }, 60); }
})();
</script>"""

page = shell(title="Media · the films, trailers and highlights of NEW YORKERS by MLow",
             description="THE SCREENING ROOM: every film, trailer and highlight from NEW YORKERS by MLow in one place, newest first. " + L["label"] + " leads.",
             body=body, path="media.html", active="MEDIA", extra_css=css, scripts_after=scripts_after,
             image=f"{URL}/assets/film/{L['slug']}/poster.jpg",
             keywords=["NEW YORKERS films", "MLow", "hype film", "trailer", "NEW YORKERS media", L["title"]],
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "Media · NEW YORKERS by MLow", "url": f"{URL}/media",
                     "isPartOf": {"@id": URL + "/#site"}, "about": {"@id": URL + "/#collection"}})
open(os.path.join(SITE, "media.html"), "w", encoding="utf-8").write(page)
print("media.html:", len(FILMS), "films;", ", ".join(f"{F['slug']} {mmss(F['sec'])}" for F in FILMS))
