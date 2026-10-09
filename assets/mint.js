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
   lime progress line along its top edge; the Keystone cell reads "50 ON CHAIN · 111 PAINTED · 0.069 ETH".
   Without the file nothing changes. window.NY_MINT carries the data for other scripts. */
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
    close: Date.parse("2026-10-23T11:11:00-04:00")
  };

  /* The founding New Yorkers, dynamic ones of one on Transient Labs ERC-7160TL, indexed on
     SuperRare. Open ended: it grows as new Keystone New Yorkers are painted. Priced in ETH, so
     unlike the census this figure does not move. */
  var KEY = {
    url:  "https://transient.xyz/mint/newyorkers",
    name: "KEYSTONE, ONES OF ONE",
    meta: "111 AND COUNTING · 0.069 ETH",
    metaSm: "0.069 ETH",
    cta:  "MINT ON TRANSIENT",
    ctaSm: "TRANSIENT",
    nameSm: "KEYSTONE"
  };

  if (document.getElementById("ny-mintbar")) return;
  try { if (sessionStorage.getItem("ny_mintbar_hidden") === "1") return; } catch (e) {}

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
    '#ny-mintbar .drop.key .cta{background:transparent;color:#ECE8DD;border:1px solid rgba(236,232,221,.3)}',
    '#ny-mintbar .drop.key:hover .cta{border-color:#61C9E2;color:#61C9E2}',

    '#ny-mintbar .clock{font-family:"IBM Plex Mono",Menlo,monospace;font-size:10.5px;letter-spacing:.1em;',
      'color:#61C9E2;font-variant-numeric:tabular-nums}',
    '#ny-mintbar .dot{width:7px;height:7px;border-radius:50%;background:#ECC981;flex:0 0 auto;',
      'animation:nyblink 1.4s ease-in-out infinite}',
    '@keyframes nyblink{0%,100%{opacity:1}50%{opacity:.25}}',
    '#ny-mintbar .x{flex:0 0 auto;align-self:center;background:none;border:0;color:#8FA7AB;font-size:17px;',
      'line-height:1;cursor:pointer;padding:6px 4px;margin-left:6px}',
    '#ny-mintbar .x:hover{color:#ECE8DD}',
    '@media (prefers-reduced-motion:reduce){#ny-mintbar,#ny-mintbar .cta,#ny-mintbar .dot{transition:none;animation:none}}',

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
      '#ny-mintbar .drop .cta{display:none}',
      '#ny-mintbar .drop .t b:after{content:" \\2197";color:#8FA7AB}',
      '#ny-mintbar .dot{width:6px;height:6px}',
      '#ny-mintbar .x{display:block;margin-left:0;padding:6px 6px}}'
  ].join("");
  document.head.appendChild(css);

  /* The logo sits at assets/brand/ from the site root. Pages in a subfolder set window.NY_BASE,
     and where they do not, count the path depth and climb. */
  var base = window.NY_BASE;
  if (typeof base !== "string") {
    var depth = location.pathname.replace(/\/+$/, "").split("/").length - 2;
    base = depth > 0 ? new Array(depth + 1).join("../") : "";
  }

  function cell(cls, d, id) {
    return '<a class="drop ' + cls + '" id="' + id + '" href="' + d.url + '" target="_blank" rel="noopener">' +
             (cls === "census" ? '<i class="bar" id="' + id + '-b" aria-hidden="true"></i>' : '') +
             '<span class="t"><b id="' + id + '-n">' + d.name + '</b><i id="' + id + '-m">' + d.meta + '</i></span>' +
             '<span class="cta" id="' + id + '-c">' + d.cta + '</span>' +
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
      cell("key", KEY, "ny-k") +
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
        if (d.keystone && d.keystone.onChain != null) {
          KEY.meta = fmt(d.keystone.onChain) + " ON CHAIN · " + fmt(d.keystone.painted || 111) + " PAINTED · " + (d.keystone.price || "0.069 ETH");
          KEY.metaSm = d.keystone.price || KEY.metaSm;
        }
        var pb = document.getElementById("ny-c-b");
        if (pb) pb.style.width = Math.max(0, Math.min(100, 100 * d.census.minted / (d.census.cap || 1111))).toFixed(1) + "%";
        render(); renderKey();
        try { document.dispatchEvent(new CustomEvent("ny:mint", { detail: d })); } catch (e) {}
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

  /* Only the census cell changes: it counts down, opens, then closes. The Keystone cell is open
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
      n.innerHTML = '<span class="dot"></span>' + nm(CENSUS);
      if (LIVE) {
        /* "750 OF 1,111 MINTED · 0.0042 ETH · 16 DAYS LEFT", or "750/1,111 · 0.0042 ETH" on a phone */
        var pr = LIVE.census.price || CENSUS.metaSm, ct = fmt(LIVE.census.minted) + "/" + fmt(LIVE.census.cap || 1111);
        if (sm()) m.innerHTML = ct + " · " + pr;
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

  /* The Keystone cell is static, so it is only redrawn when the viewport crosses the breakpoint. */
  function renderKey() {
    var m = document.getElementById('ny-k-m'), b = document.getElementById('ny-k-c'), n = document.getElementById('ny-k-n');
    if (!m) return;
    n.textContent = nm(KEY);
    if (!sm() && LIVE && LIVE.keystone && LIVE.keystone.onChain != null) {
      fit(m, [KEY.meta, fmt(LIVE.keystone.onChain) + " ON CHAIN · " + KEY.metaSm, KEY.metaSm]);
    } else {
      m.textContent = meta(KEY);
    }
    b.textContent = cta(KEY);
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

  function mount() {
    document.body.appendChild(bar);
    render(); renderKey();
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
