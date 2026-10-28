/* NEW YORKERS · the mint bar.
   Self contained on purpose. It carries no dependency on config.js, site.js or data.js, because
   the art pages (census, museum, map, keystone) do not all load them and the mint links have to be
   on every single page without exception. One script tag, nothing else.

   Pinned to the bottom, never the top: the museum is a full screen canvas and three other pages
   carry their own headers. A bottom bar overlays all of them and changes no layout anywhere.

   TWO DROPS, TWO CELLS. The first version put both prices in one row with a single button, so
   0.069 ETH sat next to a button that actually went to the eleven dollar mint. Each drop now owns
   a cell: its name, its price and its own button, inside one link, with a rule between them. A
   price can only be read against the button it is grouped with.

   THE LIVE COUNT (2026-10-07). After mount the bar fetches api/mint.json (build_mint.py, from the chain
   snapshot) and the census cell reads "750 OF 1,111 MINTED · 0.0042 ETH · 16 DAYS LEFT" with a two pixel
   lime progress line along its top edge. The second cell is THE MARKS since 2026-10-28 (Keystone left the bar).
   Without the file nothing changes. window.NY_MINT carries the data for other scripts.

   THE TURNSTILE (2026-10-23, MLow: "make the mint buttons more fun and degen"). The census button is a
   MetroCard sitting in a turnstile reader (art made on FLORA, assets/ui/metrocard.webp). Drag it through
   the slot to mint: a clean swipe beeps GO and opens OpenSea; a slow one gets the oldest joke in the
   city, SWIPE AGAIN AT THIS TURNSTILE. A plain click still mints at once, no friction, and plays the swipe
   on the way out. The reader's dot matrix scrolls the latest real mints from api/mint.json, and the name
   carries how many are left.
   Sound only ever follows the visitor's own click or drag. */
(function () {
  "use strict";

  var CENSUS = {
    url:   "https://opensea.io/collection/newyorkers/overview",
    name:  "THE CENSUS RELEASE",
    /* Quote the ETH price, never dollars: the dollar figure drifts with ETH (it moved from $11.14
       to $11.24 inside the first hour). 0.0042 ETH for the whole window: a raise to 0.01 ETH was written onto the site on 30 September 2026 but the price on the contract never changed, so it was reverted on 1 October. */
    meta:  "1,111 · 0.0042 ETH",
    metaSm: "0.0042 ETH",
    cta:   "MINT ON OPENSEA",
    ctaSm:  "OPENSEA",
    nameSm: "CENSUS",
    open:  Date.parse("2026-09-23T11:11:00-04:00"),
    close: Date.parse("2026-11-07T11:11:00-05:00")
  };

  /* THE MARKS (2026-10-28, MLow: "add the link to the marks page with a nice button to the bottom banner
     and hide the keystone from the banner"). The second cell used to be KEYSTONE on Transient; it now opens
     the MARKS page on this site, where the mint lives. Keystone is still on its own page and in the nav.
     The price and the reveal are quoted from releases.json. */
  var MARKS = {
    url:  "marks.html",
    name: "THE MARKS",
    meta: "INSTANT REVEAL · 0.069 ETH",
    metaSm: "0.069 ETH",
    cta:  "BREAK THE SEAL",
    ctaSm: "MARKS",
    nameSm: "THE MARKS"
  };
  /* BREAK THE SEAL (same day, MLow picked it over a take a number dispenser and a marquee). The button is a
     cream census card tab with the MARKS page's own wax seal pressed over its edge (seal-sm and
     seal-broken-sm, 128 px copies of the page art). Hover cracks it; a click splits it in two and one Mark,
     picked at random from the page's thumbnails (assets/marks/th, named by census number), shows through
     the gap before the MARKS page opens. The thumbnail is only fetched once a pointer reaches the cell. */
  var PEEK = "1064 1092 1108 1109 1129 1160 1166 1180 1242 1282 1321 1339 1358 1363 1365 1381 1389 1466 1480 1493 1515 1520 1537 1620 1621 1674 1697 1707 1736 1782 1842 1855 1869 1875 1928 2031 2045 2084 2090 2120 2146 2154 2189 2226 2289 2305 2317 2345 2355 2377 2390 2457 2466 2605 2652 2682 2719 2785 2794 2802 2881 2922 3023 3050 3058 3137 3161 3193 3214 3264 3284 3289 3292 3296 3298 3389 3539 3572 3632 3635 3672 3684 3701 3719 3743 3748 3768 3775 3807 3822 3834 3836 3853 3854 4003 4039 4184 4242 4259 4286 4354 4355 4366 4486 4597 4667 4706 4765 4766 4771 4891 4918 4926 4965 5050 5074 5101 5244 5323 5335 5356 5391 5392 5427 5453 5683 5744 6181 6270 6333 6490 6654 6860 6861 6866 6875 6887 6937 6990 7333 7356 7474 7490 7506 7515 783 788 7947 795 803 816 817 845 878 928 932 951 966 977".split(" ");
  var peekNo = PEEK[Math.floor(Math.random() * PEEK.length)];

  if (document.getElementById("ny-mintbar")) return;
  try { if (sessionStorage.getItem("ny_mintbar_hidden") === "1") return; } catch (e) {}

  /* The logo, the card and the token sit under assets/ from the site root. Pages in a subfolder set window.NY_BASE,
     and where they do not, count the path depth and climb. */
  var base = window.NY_BASE;
  if (typeof base !== "string") {
    var depth = location.pathname.replace(/\/+$/, "").split("/").length - 2;
    base = depth > 0 ? new Array(depth + 1).join("../") : "";
  }

  var css = document.createElement("style");
  css.textContent = [
    '#ny-mintbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
      'font-family:"Space Grotesk",-apple-system,"Helvetica Neue",Arial,sans-serif;',
      'background:rgba(8,13,22,.96);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
      'border-top:1px solid #24394A;color:#ECE8DD;',
      'transform:translateY(105%);transition:transform .5s cubic-bezier(.2,.8,.2,1)}',
    '#ny-mintbar.in{transform:translateY(0)}',
    '#ny-mintbar .wrap{display:flex;align-items:stretch;gap:0;max-width:1440px;margin:0 auto;padding:0 14px}',
    '#ny-mintbar .mark{display:flex;align-items:center;padding-right:14px;flex:0 0 auto}',
    '#ny-mintbar .mark img{width:26px;height:26px;display:block}',

    /* one cell per drop: name, price and button inside a single link */
    '#ny-mintbar .drop{position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center;gap:14px;',
      'padding:10px 16px;text-decoration:none;color:inherit;border-left:1px solid #24394A;',
      'transition:background .2s}',
    /* the progress line: minted over the cap, along the top edge of the census cell, from api/mint.json */
    '#ny-mintbar .drop .bar{position:absolute;left:0;top:0;height:2px;width:0;background:#ECC981;',
      'border-radius:2px;transition:width .9s cubic-bezier(.2,.8,.2,1)}',
    '#ny-mintbar .drop:hover{background:rgba(236,232,221,.04)}',
    '#ny-mintbar .drop .t{min-width:0;flex:1 1 auto}',
    '#ny-mintbar .drop .t b{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;',
      'letter-spacing:.17em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#ny-mintbar .drop .t i{display:block;font-style:normal;font-family:"IBM Plex Mono",Menlo,monospace;',
      'font-size:10.5px;letter-spacing:.1em;color:#8FA7AB;margin-top:3px;white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis}',
    '#ny-mintbar .drop .cta{flex:0 0 auto;display:inline-flex;align-items:center;font-weight:700;',
      'font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;padding:11px 16px;border-radius:6px;',
      'line-height:1;white-space:nowrap;transition:all .22s cubic-bezier(.2,.8,.2,1)}',
    /* the census button is the loud one while its window is open */
    '#ny-mintbar .drop.census .cta{background:#ECE8DD;color:#080D16}',
    '#ny-mintbar .drop.census.live .cta{background:#ECC981;color:#080D16}',
    '#ny-mintbar .drop.census:hover .cta{box-shadow:0 8px 24px rgba(236,201,129,.32)}',
    /* BREAK THE SEAL: a cream census card tab, the wax seal pressed over its left edge, a Mark under the wax */
    '#ny-mintbar .drop.marks .cta{position:relative;gap:8px;padding:10px 14px 10px 40px;margin-left:22px;border-radius:3px;',
      'color:#8E1F1A;background:linear-gradient(180deg,#F4ECDA,#E6DBC2);font-family:"IBM Plex Mono",Menlo,monospace;',
      'box-shadow:inset 0 0 0 1px rgba(142,31,26,.18),inset 0 -2px 0 rgba(8,13,22,.12),0 4px 14px rgba(0,0,0,.35);transform:rotate(-1deg)}',
    '#ny-mintbar .drop.marks:hover .cta{transform:rotate(0) translateY(-1px);box-shadow:inset 0 0 0 1px rgba(142,31,26,.3),inset 0 -2px 0 rgba(8,13,22,.12),0 10px 24px rgba(179,38,30,.3)}',
    '#ny-mintbar .nyseal{position:absolute;left:-22px;top:50%;width:52px;height:52px;margin-top:-26px;pointer-events:none}',
    '#ny-mintbar .thumb.nyseal{position:relative;left:auto;top:auto;margin:0;width:30px;height:30px;flex:0 0 auto}',
    '#ny-mintbar .nyseal i{position:absolute;inset:0;background:center/contain no-repeat;',
      'transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .35s;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}',
    '#ny-mintbar .nyseal .w0{background-image:url(' + base + 'assets/marks/seal-sm.webp)}',
    '#ny-mintbar .nyseal .wl,#ny-mintbar .nyseal .wr{background-image:url(' + base + 'assets/marks/seal-broken-sm.webp);opacity:0}',
    '#ny-mintbar .nyseal .wl{clip-path:inset(0 50% 0 0)}',
    '#ny-mintbar .nyseal .wr{clip-path:inset(0 0 0 50%)}',
    /* the Mark under the wax, round like the seal and a little smaller */
    '#ny-mintbar .nyseal .pk{inset:16%;border-radius:50%;background-color:#B3261E;background-size:cover;filter:none;',
      'box-shadow:0 0 0 2px #F4ECDA,0 0 14px rgba(236,201,129,.0);transform:scale(.6);opacity:0}',
    /* hover: the seal cracks and trembles */
    '#ny-mintbar .drop.marks:hover .nyseal .w0{opacity:0}',
    '#ny-mintbar .drop.marks:hover .nyseal .wl,#ny-mintbar .drop.marks:hover .nyseal .wr{opacity:1}',
    '#ny-mintbar .drop.marks:hover .nyseal{animation:nywax .5s ease-in-out infinite}',
    '@keyframes nywax{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}',
    /* click: the halves fall apart and the Mark comes through */
    '#ny-mintbar .nyseal.open{animation:none!important}',
    '#ny-mintbar .nyseal.open .w0{opacity:0}',
    '#ny-mintbar .nyseal.open .wl{opacity:1;transform:translate(-13px,9px) rotate(-28deg)}',
    '#ny-mintbar .nyseal.open .wr{opacity:1;transform:translate(13px,9px) rotate(28deg)}',
    '#ny-mintbar .nyseal.open .wl,#ny-mintbar .nyseal.open .wr{transition:transform .6s cubic-bezier(.2,.8,.2,1),opacity .4s .3s;opacity:0}',
    '#ny-mintbar .nyseal.open .pk{opacity:1;transform:scale(1.15);box-shadow:0 0 0 2px #F4ECDA,0 0 18px rgba(236,201,129,.85)}',
    '#ny-mintbar .drop.marks .arr{display:inline-block;transition:transform .22s cubic-bezier(.2,.8,.2,1)}',
    '#ny-mintbar .drop.marks:hover .arr{transform:translateX(3px)}',

    '#ny-mintbar .clock{font-family:"IBM Plex Mono",Menlo,monospace;font-size:10.5px;letter-spacing:.1em;',
      'color:#61C9E2;font-variant-numeric:tabular-nums}',
    '#ny-mintbar .dot{width:7px;height:7px;border-radius:50%;background:#ECC981;flex:0 0 auto;',
      'animation:nyblink 1.4s ease-in-out infinite}',
    '@keyframes nyblink{0%,100%{opacity:1}50%{opacity:.25}}',
    '#ny-mintbar .x{flex:0 0 auto;align-self:center;background:none;border:0;color:#8FA7AB;font-size:17px;',
      'line-height:1;cursor:pointer;padding:6px 4px;margin-left:6px}',
    '#ny-mintbar .x:hover{color:#ECE8DD}',
    /* how many are left: a coral sticker after the release name, louder as the count falls */
    '#ny-mintbar .left{flex:0 0 auto;font-size:9.5px;letter-spacing:.12em;padding:3px 6px 2px;border-radius:3px;',
      'background:#DC6F57;color:#080D16;transform:rotate(-2deg);box-shadow:0 0 0 1px rgba(8,13,22,.6)}',
    '#ny-mintbar .left.hot{animation:nyhot 1.1s ease-in-out infinite}',
    '@keyframes nyhot{0%,100%{transform:rotate(-2deg) scale(1)}50%{transform:rotate(2deg) scale(1.08)}}',

    /* THE TURNSTILE: a steel reader, a slot, the MetroCard in it and a dot matrix screen */
    '#ny-mintbar .reader{position:relative;flex:0 0 auto;width:226px;height:44px;border-radius:8px;',
      'background:linear-gradient(180deg,#2A3846,#141E2A 55%,#0E1620);border:1px solid #3A4C5D;',
      'box-shadow:inset 0 1px 0 rgba(236,232,221,.12),0 4px 14px rgba(0,0,0,.35)}',
    '#ny-mintbar .groove{position:absolute;left:8px;width:118px;top:50%;height:4px;margin-top:-2px;border-radius:2px;',
      'background:#03060A;box-shadow:inset 0 1px 2px #000,0 1px 0 rgba(236,232,221,.1)}',
    '#ny-mintbar .card{position:absolute;left:8px;top:50%;width:60px;height:40px;margin-top:-20px;border-radius:3px;',
      'background:#ECC981 url(' + base + 'assets/ui/metrocard.webp) center/cover;cursor:grab;touch-action:none;',
      '-webkit-user-drag:none;user-select:none;-webkit-user-select:none;z-index:1;',
      'box-shadow:0 3px 8px rgba(0,0,0,.55),inset 0 0 0 1px rgba(0,0,0,.25);transform:rotate(-5deg);',
      'transition:transform .38s cubic-bezier(.3,1.5,.5,1),opacity .3s}',
    '#ny-mintbar .drop.census:hover .card{animation:nynudge 1.2s ease-in-out infinite}',
    '@keyframes nynudge{0%,100%{transform:rotate(-5deg) translateX(0)}50%{transform:rotate(-1deg) translateX(9px)}}',
    '#ny-mintbar .card.drag{cursor:grabbing;transition:none;animation:none!important}',
    '#ny-mintbar .card.swipe{animation:none!important;transform:translateX(66px) rotate(0);',
      'transition:transform .42s cubic-bezier(.6,0,.4,1)}',
    '#ny-mintbar .card.gone{opacity:0;transform:translateX(96px) rotate(0)}',
    '#ny-mintbar .card.shake{animation:nyshake .45s linear!important}',
    '@keyframes nyshake{0%,100%{transform:rotate(-5deg) translateX(0)}20%,60%{transform:rotate(-8deg) translateX(-5px)}40%,80%{transform:rotate(-2deg) translateX(5px)}}',
    '#ny-mintbar .led{position:absolute;right:7px;top:8px;bottom:8px;width:86px;border-radius:4px;overflow:hidden;',
      'background:#090604;box-shadow:inset 0 0 0 1px #000,inset 0 2px 6px rgba(0,0,0,.8);',
      'font:700 10.5px/26px "IBM Plex Mono",Menlo,monospace;letter-spacing:.08em;color:#FFE2A6;',
      'text-shadow:0 0 4px rgba(236,201,129,.9),0 0 10px rgba(236,201,129,.45);white-space:nowrap;text-align:center}',
    /* the dot matrix: a grid of dark gaps over the glowing text */
    '#ny-mintbar .led:after{content:"";position:absolute;inset:0;pointer-events:none;',
      'background:radial-gradient(circle,transparent 62%,rgba(9,6,4,.42) 72%) 0 0/2px 2px}',
    '#ny-mintbar .led span{display:inline-block}',
    '#ny-mintbar .led.run span{padding-left:100%;animation:nyrun var(--d,6s) linear 1 forwards}',
    '@keyframes nyrun{to{transform:translateX(-100%)}}',
    '#ny-mintbar .led.go{color:#61C9E2;text-shadow:0 0 8px rgba(97,201,226,.9)}',
    '#ny-mintbar .led.no{color:#DC6F57;text-shadow:0 0 8px rgba(220,111,87,.9)}',

    '#ny-mintbar .thumb{display:none}',

    '@media (prefers-reduced-motion:reduce){#ny-mintbar,#ny-mintbar .cta,#ny-mintbar .dot,#ny-mintbar .left,#ny-mintbar .card,#ny-mintbar .led span{transition:none;animation:none!important}}',

    /* narrow (MLow 2026-10-06, the stacked version was 102 px and sat on top of the keystone and museum
       controls): one slim row, the two drops side by side, each cell its own button holding its own
       name and price, and a close. */
    '@media (max-width:860px){',
      '#ny-mintbar .wrap{padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));gap:6px;align-items:center}',
      '#ny-mintbar .mark{display:none}',
      '#ny-mintbar .drop{flex:1 1 0;border-left:0;padding:7px 10px;gap:8px;border-radius:8px;',
        'border:1px solid #24394A;justify-content:space-between}',
      '#ny-mintbar .drop.census.live{border-color:rgba(236,201,129,.55)}',
      '#ny-mintbar .drop .t b{font-size:9.5px;letter-spacing:.1em;gap:5px}',
      '#ny-mintbar .drop .t i{font-size:9.5px;margin-top:2px;color:#ECE8DD}',
      '#ny-mintbar .drop .cta,#ny-mintbar .reader{display:none}',
      '#ny-mintbar .drop .t b:after{content:" \\2197";color:#8FA7AB}',
      '#ny-mintbar .dot{width:6px;height:6px}',
      /* the card and the token ride along on a phone as thumbnails; a tap swipes the card or drops the token */
      '#ny-mintbar .drop{padding:6px 8px;gap:7px;justify-content:flex-start}',
      '#ny-mintbar .thumb{display:block;flex:0 0 auto;position:relative}',
      '#ny-mintbar .thumb.mc{width:32px;height:21px;border-radius:2px;transform:rotate(-6deg);',
        'background:#ECC981 url(' + base + 'assets/ui/metrocard.webp) center/cover;box-shadow:0 2px 5px rgba(0,0,0,.5)}',
      '#ny-mintbar .thumb.mc.swipe{transform:translateX(18px) rotate(0);opacity:0;transition:transform .4s cubic-bezier(.6,0,.4,1),opacity .4s .15s}',
      '#ny-mintbar .drop.marks{border-color:rgba(179,38,30,.6)}',
      '#ny-mintbar .drop .t b .left{display:none}',
      '#ny-mintbar .x{display:block;margin-left:0;padding:6px 6px}}'
  ].join("");
  document.head.appendChild(css);


  function cell(cls, d, id) {
    /* the census mints off site in a new tab; the MARKS page is on this site, so it opens in place */
    var href = cls === "census" ? d.url + '" target="_blank" rel="noopener' : base + d.url;
    return '<a class="drop ' + cls + '" id="' + id + '" href="' + href + '">' +
             (cls === "census" ? '<i class="bar" id="' + id + '-b" aria-hidden="true"></i>' : '') +
             (cls === "census" ? '<i class="thumb mc" aria-hidden="true"></i>' : '<i class="thumb nyseal" aria-hidden="true"><i class="w0"></i><i class="pk"></i><i class="wl"></i><i class="wr"></i></i>') +
             '<span class="t"><b id="' + id + '-n">' + d.name + '</b><i id="' + id + '-m">' + d.meta + '</i></span>' +
             (cls === "census"
               ? '<span class="reader" aria-hidden="true"><i class="groove"></i><i class="card" id="ny-card" draggable="false"></i>' +
                   '<b class="led" id="ny-led"><span>SWIPE \u203a</span></b></span>' +
                 '<span class="sr" id="' + id + '-c" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">' + d.cta + '</span>'
               : '<span class="cta" id="' + id + '-c-w"><i class="nyseal" aria-hidden="true"><i class="w0"></i><i class="pk"></i><i class="wl"></i><i class="wr"></i></i><span id="' + id + '-c">' + d.cta + '</span><span class="arr" aria-hidden="true">\u203a</span></span>') +
           '</a>';
  }

  var bar = document.createElement("div");
  bar.id = "ny-mintbar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Mint NEW YORKERS");
  bar.innerHTML =
    '<div class="wrap">' +
      '<span class="mark"><img src="' + base + 'assets/brand/eye_truecolor.png" alt="" aria-hidden="true"></span>' +
      cell("census", CENSUS, "ny-c") +
      cell("marks", MARKS, "ny-k") +
      '<button class="x" type="button" aria-label="Hide the mint bar">&times;</button>' +
    '</div>';

  function two(n) { return n < 10 ? "0" + n : String(n); }
  /* On a phone the price is the one string that must never be cut, because a half read price
     is exactly the confusion this layout exists to remove. Drop the count and the status
     instead, and shorten the button to the platform name. */
  function sm()   { return window.innerWidth <= 860; }
  function nm(d)  { return sm() ? d.nameSm : d.name; }
  function meta(d){ return sm() ? d.metaSm : d.meta; }
  function cta(d) { return sm() ? d.ctaSm  : d.cta; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* THE LIVE COUNT. api/mint.json is written by _build/build_mint.py from the chain snapshot. It is
     fetched once after mount and the bar fails silently without it, so a page is never worse than
     the static copy above. The query changes every fifteen minutes so a browser or edge cache that
     holds /api/* for hours (the Cloudflare floor) cannot pin the count to the first read. */
  var LIVE = null;
  function load() {
    if (!window.fetch) return;
    fetch(base + "api/mint.json?v=" + Math.floor(Date.now() / 9e5), { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.census || d.census.minted == null) return;
        LIVE = d; window.NY_MINT = d;
        if (d.census.close) { var cl = Date.parse(d.census.close); if (cl) CENSUS.close = cl; }
        if (d.census.open)  { var op = Date.parse(d.census.open);  if (op) CENSUS.open = op; }
        var pb = document.getElementById("ny-c-b");
        if (pb) pb.style.width = Math.max(0, Math.min(100, 100 * d.census.minted / (d.census.cap || 1111))).toFixed(1) + "%";
        render(); renderKey();
        try { document.dispatchEvent(new CustomEvent("ny:mint", { detail: d })); } catch (e) {}
        live();
        setInterval(function () { if (!document.hidden) live(); }, 60000);
      })
      .catch(function () {});
  }

  /* THE LIVE COUNT, LIVE (2026-10-26, MLow: "needs to update automatically when pieces are minted").
     api/mint.json only moves when the site is rebuilt. /api/mint (a Pages Function) reads totalSupply and
     the latest mints off the chain, held at the edge for a minute; it is polled once a minute while the tab
     is visible and merged over the static numbers. If it fails the bar keeps what it has. A mint that lands
     while someone is watching flashes on the reader. */
  var liveSeen = false;
  function live() {
    if (!window.fetch || !LIVE) return;
    fetch(base + "api/mint", { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok || !d.census || d.census.minted == null) return;
        var was = LIVE.census.minted;
        LIVE.census.minted = d.census.minted;
        var rec = (d.recent || []).filter(function (r) { return r && r.n; });
        if (rec.length) {
          var seen = {};
          rec.forEach(function (r) { seen[r.t] = 1; });
          LIVE.recent = rec.concat((LIVE.recent || []).filter(function (r) { return r && !seen[r.t]; })).slice(0, 12);
        }
        if (d.asOf) LIVE.asOf = d.asOf;
        var pb = document.getElementById("ny-c-b");
        if (pb) pb.style.width = Math.max(0, Math.min(100, 100 * LIVE.census.minted / (LIVE.census.cap || 1111))).toFixed(1) + "%";
        render(); renderKey();
        /* only a mint that lands while the page is open flashes; the first read just catches up with the build */
        var first = !liveSeen; liveSeen = true;
        if (!first && LIVE.census.minted > was && rec.length && isOpen())
          led("JUST COUNTED: NEW YORKER No. " + rec[0].n + " · " + fmt(remaining()) + " LEFT", "go", true, 7000);
        try { document.dispatchEvent(new CustomEvent("ny:mint", { detail: LIVE })); } catch (e) {}
      })
      .catch(function () {});
  }

  /* Time left in the window: days until the last two days, hours until the last day, then the live
     clock. The count is spelt out in full on the desktop cell only. */
  function left(now) {
    var ms = Math.max(0, CENSUS.close - now), h = ms / 36e5;
    if (h >= 48) return Math.floor(h / 24) + " DAYS LEFT";
    if (h >= 24) return Math.floor(h) + " HOURS LEFT";
    var sec = Math.floor(ms / 1000);
    return '<span class="clock">' + two(Math.floor(sec / 3600)) + ":" + two(Math.floor(sec / 60) % 60) + ":" + two(sec % 60) + " LEFT</span>";
  }
  function count() { return fmt(LIVE.census.minted) + (sm() ? "/" : " OF ") + fmt(LIVE.census.cap || 1111); }
  /* A meta line that overflows its cell is cut with an ellipsis, and the price is the last thing on it.
     Try each shorter form in turn until the whole line fits; the price is on every one of them. */
  function fit(m, forms) {
    for (var i = 0; i < forms.length; i++) {
      m.innerHTML = forms[i];
      if (m.scrollWidth <= m.clientWidth + 1) return;
    }
  }

  /* How many of the release are still open, from the live count; null before api/mint.json lands. */
  function remaining() {
    if (!LIVE) return null;
    return Math.max(0, (LIVE.census.cap || 1111) - LIVE.census.minted);
  }
  function badge() {
    var r = remaining();
    if (r == null || r <= 0) return "";
    var t = r <= 20 ? "LAST " + fmt(r) : r <= 150 ? "ONLY " + fmt(r) + " LEFT" : fmt(r) + " LEFT";
    return '<span class="left' + (r <= 150 ? " hot" : "") + '">' + t + "</span>";
  }

  /* Only the census cell changes: it counts down, opens, then closes. The MARKS cell is open
     ended and never needs a state. */
  function render() {
    var now = Date.now(),
        c   = document.getElementById("ny-c"),
        n   = document.getElementById("ny-c-n"),
        m   = document.getElementById("ny-c-m"),
        b   = document.getElementById("ny-c-c");
    if (!n) return;

    if (now < CENSUS.open) {
      c.className = "drop census";
      var sec = Math.floor(Math.max(0, CENSUS.open - now) / 1000);
      n.innerHTML = nm(CENSUS);
      m.innerHTML = meta(CENSUS) + ' · <span class="clock">' + (sm() ? '' : 'OPENS IN ') +
        two(Math.floor(sec / 3600)) + ":" + two(Math.floor(sec / 60) % 60) + ":" + two(sec % 60) + "</span>";
      b.textContent = cta(CENSUS);
      return;
    }
    if (now < CENSUS.close) {
      c.className = "drop census live";
      /* set only on change: a rewrite every second would restart the sticker's wobble */
      var nh = '<span class="dot"></span>' + nm(CENSUS) + badge();
      if (n.innerHTML !== nh) n.innerHTML = nh;
      if (LIVE) {
        /* "750 OF 1,111 MINTED · 0.0042 ETH · 16 DAYS LEFT", or "100 LEFT · 0.0042 ETH" on a phone */
        var pr = LIVE.census.price || CENSUS.metaSm, ct = fmt(LIVE.census.minted) + "/" + fmt(LIVE.census.cap || 1111);
        if (sm()) m.innerHTML = (remaining() > 0 ? fmt(remaining()) + " LEFT" : ct) + " · " + pr;
        else fit(m, [count() + " MINTED · " + pr + " · " + left(now), ct + " · " + pr + " · " + left(now), ct + " · " + pr]);
      } else {
        m.textContent = sm() ? meta(CENSUS) : (CENSUS.meta + " · MINTING NOW");
      }
      b.textContent = cta(CENSUS);
      return;
    }
    c.className = "drop census";
    n.innerHTML = nm(CENSUS);
    if (LIVE) m.textContent = sm() ? "CLOSED" : count() + " MINTED · CLOSED · NEVER REOPENED OR TOPPED UP";
    else m.textContent = sm() ? "CLOSED" : "CLOSED · NEVER REOPENED OR TOPPED UP";
    b.textContent = sm() ? "OPENSEA" : "VIEW ON OPENSEA";
  }

  /* The MARKS cell is static, so it is only redrawn when the viewport crosses the breakpoint. */
  function renderKey() {
    var m = document.getElementById('ny-k-m'), b = document.getElementById('ny-k-c'), n = document.getElementById('ny-k-n');
    if (!m) return;
    n.textContent = nm(MARKS);
    m.textContent = meta(MARKS);
    b.textContent = cta(MARKS);
  }

  /* Make room for the bar. A page that scrolls gets padding at the bottom so its last lines are
     never under the bar. A full screen page (museum, keystone, markup, tv) does not scroll, so its
     own controls pinned to the bottom edge are lifted by the bar's height instead, and put back
     when the bar is closed. */
  var lifted = [];
  function makeRoom() {
    var h = bar.offsetHeight, de = document.documentElement;
    de.style.setProperty("--ny-mintbar-h", h + "px");
    var scrolls = de.scrollHeight > window.innerHeight + 4 && getComputedStyle(document.body).overflowY !== "hidden";
    if (scrolls) { document.body.style.paddingBottom = h + "px"; return; }
    var all = document.body.getElementsByTagName("*"), vh = window.innerHeight;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (bar.contains(e) || "nyLift" in e.dataset) continue;
      var cs = getComputedStyle(e);
      /* fixed, or absolute against the page itself; anything positioned inside another box moves with that box */
      if (cs.position !== "fixed" && !(cs.position === "absolute" && (!e.offsetParent || e.offsetParent === document.body))) continue;
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (e.parentElement && e.parentElement.closest("[data-ny-lift]")) continue;
      var r = e.getBoundingClientRect();
      /* a control in the lower part of the screen, not a full height panel or the canvas */
      if (!r.height || r.height > vh * 0.45 || r.top < vh * 0.5 || r.bottom > vh + 2) continue;
      var b = parseFloat(cs.bottom); if (isNaN(b) || b > vh * 0.45) continue;
      e.dataset.nyLift = e.style.bottom || "";
      e.style.bottom = (b + h) + "px";
      lifted.push(e);
    }
  }
  function giveBack() {
    document.body.style.paddingBottom = "";
    document.documentElement.style.removeProperty("--ny-mintbar-h");
    for (var i = 0; i < lifted.length; i++) { lifted[i].style.bottom = lifted[i].dataset.nyLift; delete lifted[i].dataset.nyLift; }
    lifted = [];
  }

  /* THE TURNSTILE. The sounds are fetched only once a pointer reaches the bar, and only ever played
     inside the visitor's own click or drag. */
  var SND = {};
  function preload() {
    if (SND.go) return;
    ["go", "again"].forEach(function (k) {
      try { SND[k] = new Audio(base + "assets/ui/turnstile-" + k + ".mp3"); SND[k].preload = "auto"; SND[k].volume = 0.5; } catch (e) {}
    });
  }
  function snd(k) {
    preload();
    try { var a = SND[k]; a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function isOpen() { var t = Date.now(); return t >= CENSUS.open && t < CENSUS.close; }

  /* The dot matrix. A message held by a swipe (GO, SWIPE AGAIN) wins over the idle loop until it expires. */
  var ledBusy = 0, ledI = 0, ledT = null;
  function led(text, cls, run, hold) {
    var el = document.getElementById("ny-led"); if (!el) return;
    el.className = "led" + (cls ? " " + cls : "") + (run ? " run" : "");
    if (run) el.style.setProperty("--d", Math.max(3.5, text.length * 0.17).toFixed(1) + "s");
    el.innerHTML = "<span>" + text + "</span>";
    if (hold) {
      ledBusy = Date.now() + hold;
      clearTimeout(ledT); ledT = setTimeout(ledLoop, hold + 50);
    }
  }
  /* Only a mint from the last day gets its age; an older one reads as a plain fact. */
  function fresh(at) {
    var s = Date.now() / 1000 - (at || 0);
    if (!at || s < 0 || s > 86400) return "";
    return s < 3600 ? " · " + Math.max(1, Math.round(s / 60)) + " MIN AGO" : " · " + Math.round(s / 3600) + "H AGO";
  }
  function ledLoop() {
    clearTimeout(ledT);
    if (!document.getElementById("ny-led")) return;
    if (Date.now() < ledBusy) { ledT = setTimeout(ledLoop, ledBusy - Date.now() + 50); return; }
    if (Date.now() >= CENSUS.close) { led("CLOSED"); return; }
    if (Date.now() < CENSUS.open) { led("SOON"); ledT = setTimeout(ledLoop, 5000); return; }
    var step = ledI++, msgs = [];
    /* the team's own wallet is never shown off as a collector */
    var rec = LIVE && LIVE.recent ? LIVE.recent.filter(function (r) { return r && r.o && r.n && !/^n3wyorkers\.eth$/i.test(r.o); }) : [];
    if (rec.length) {
      var r = rec[Math.floor(step / 4) % rec.length];
      msgs.push("NEW YORKER No. " + r.n + " COUNTED BY " + r.o + fresh(r.at));
    }
    var rem = remaining();
    if (rem) msgs.push(fmt(rem) + " LEFT AT " + (LIVE.census.price || CENSUS.metaSm) + " · DRAG THE CARD OR TAP");
    if (step % 2 === 0 || !msgs.length) { led("SWIPE ›"); ledT = setTimeout(ledLoop, 3200); return; }
    var txt = msgs[Math.floor(step / 2) % msgs.length];
    led(txt, "", true);
    ledT = setTimeout(ledLoop, Math.max(3.5, txt.length * 0.17) * 1000 + 300);
  }

  /* The swipe. Drag the card through the slot: past 80% of the travel inside 0.9 s is a clean read and
     mints (the link's own click, so the tab opens and the hit is counted as any click is); slower is
     the turnstile's oldest line. Two misses and it lets you through anyway. A tap is just the link. */
  var TRAVEL = 66, drag = null, skipClick = false, programmatic = false, misses = 0;
  function cardTo(cls) { var c = document.getElementById("ny-card"); if (c) c.className = "card" + (cls ? " " + cls : ""); }
  function go(viaDrag) {
    snd("go");
    led("GO", "go", false, 2600);
    cardTo("swipe");
    setTimeout(function () { cardTo("swipe gone"); }, 420);
    setTimeout(function () { cardTo(""); }, 2600);
    var th = bar.querySelector(".thumb.mc");
    if (th) { th.className = "thumb mc swipe"; setTimeout(function () { th.className = "thumb mc"; }, 1800); }
    misses = 0;
    if (viaDrag) {
      var a = document.getElementById("ny-c");
      programmatic = true; try { a.click(); } finally { programmatic = false; }
    }
  }
  function reject() {
    misses++;
    snd("again");
    led(misses >= 2 ? "OK FINE. JUST TAP IT, SER" : "SWIPE AGAIN AT THIS TURNSTILE", "no", true, 5200);
    cardTo("shake");
    setTimeout(function () { cardTo(""); }, 460);
  }
  function wire() {
    var card = document.getElementById("ny-card");
    bar.addEventListener("pointerenter", preload);
    if (card) {
      card.addEventListener("pointerdown", function (e) {
        if (e.button || !isOpen()) return;
        e.preventDefault();
        preload();
        drag = { x: e.clientX, t: 0, done: 0, dx: 0 };
        try { card.setPointerCapture(e.pointerId); } catch (er) {}
        cardTo("drag");
      });
      card.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var dx = Math.max(0, Math.min(TRAVEL + 6, e.clientX - drag.x)), now = Date.now();
        if (dx > 4 && !drag.t) drag.t = now;
        if (dx >= TRAVEL * 0.8 && !drag.done) drag.done = now;
        drag.dx = dx;
        card.style.transform = "translateX(" + dx + "px) rotate(" + (-5 + 5 * Math.min(1, dx / TRAVEL)) + "deg)";
      });
      card.addEventListener("pointerup", function () {
        if (!drag) return;
        var d = drag; drag = null;
        card.style.transform = "";
        cardTo("");
        if (d.dx < 6) return;
        skipClick = true; setTimeout(function () { skipClick = false; }, 400);
        if (!d.done) return;
        if (d.done - d.t > 900 && misses < 2) reject(); else go(true);
      });
      card.addEventListener("pointercancel", function () {
        if (!drag) return;
        drag = null; card.style.transform = ""; cardTo("");
      });
    }
    /* Window capture runs before site.js's document listener, so a drag that ends on the link is not
       counted as a mint click, and a real click gets the swipe on its way out. */
    window.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("#ny-mintbar a.drop") : null;
      if (!t) {
        /* the other census buttons (home, counted) get the turnstile sound too */
        var o = e.target && e.target.closest ? e.target.closest('a[href*="opensea.io/collection/newyorkers"]') : null;
        if (o && (o.id === "hmGo" || /\bbtn\b/.test(o.className)) && isOpen()) {
          snd("go");
          if (o.id === "hmGo") {
            o.classList.add("swipe");
            /* the home card opens in the same tab: hold the page half a second so the swipe is seen */
            if (o.target !== "_blank" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
              e.preventDefault();
              setTimeout(function () { location.href = o.href; }, 520);
            }
            setTimeout(function () { o.classList.remove("swipe"); }, 1600);
          }
        }
        return;
      }
      if (programmatic) return;
      if (skipClick) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (t.id === "ny-c") { if (isOpen()) go(false); }
      else if (t.id === "ny-k") breakSeal(t, e);
    }, true);
  }

  /* BREAK THE SEAL. The Mark under the wax is fetched on the first pointer over the cell. A plain click holds
     the page for the split; a modified click (new tab) and reduced motion go straight through. */
  function peek() {
    var k = document.getElementById("ny-k"); if (!k || k.dataset.pk) return;
    k.dataset.pk = peekNo;
    var ps = k.querySelectorAll(".pk");
    for (var i = 0; i < ps.length; i++) ps[i].style.backgroundImage = "url(" + base + "assets/marks/th/" + peekNo + ".jpg)";
  }
  function breakSeal(t, e) {
    peek();
    var w = t.querySelectorAll(".nyseal");
    for (var i = 0; i < w.length; i++) w[i].classList.add("open");
    var b = document.getElementById("ny-k-c");
    if (b && !sm()) b.textContent = "No. " + peekNo;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      setTimeout(function () { location.href = t.href; }, 700);
    }
    /* back button from the MARKS page restores a whole seal */
    setTimeout(function () {
      for (var i = 0; i < w.length; i++) w[i].classList.remove("open");
      if (b) b.textContent = cta(MARKS);
    }, 2200);
  }

  function mount() {
    document.body.appendChild(bar);
    render(); renderKey();
    wire(); ledLoop();
    var kc = document.getElementById("ny-k");
    if (kc) { kc.addEventListener("pointerenter", peek); kc.addEventListener("touchstart", peek, { passive: true }); }
    makeRoom(); setTimeout(makeRoom, 1500); setTimeout(makeRoom, 4000);
    setInterval(render, 1000);
    load();
    var wasSm = sm();
    window.addEventListener('resize', function () {
      if (sm() !== wasSm) { wasSm = sm(); renderKey(); render(); giveBack(); makeRoom(); }
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.className += " in"; });
    });
    bar.querySelector(".x").onclick = function () {
      bar.className = bar.className.replace(" in", "");
      try { sessionStorage.setItem("ny_mintbar_hidden", "1"); } catch (e) {}
      giveBack();
      setTimeout(function () { bar.parentNode && bar.parentNode.removeChild(bar); }, 500);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
