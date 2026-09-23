/* NEW YORKERS · the mint bar.
   Self contained on purpose. It carries no dependency on config.js, site.js or data.js, because
   the art pages (census, museum, map, keystone) do not all load them and the mint links have to be
   on every single page without exception. One script tag, nothing else.

   Pinned to the bottom, never the top: the museum is a full screen canvas and three other pages
   carry their own headers. A bottom bar overlays all of them and changes no layout anywhere.

   TWO DROPS, TWO CELLS. The first version put both prices in one row with a single button, so
   0.069 ETH sat next to a button that actually went to the eleven dollar mint. Each drop now owns
   a cell: its name, its price and its own button, inside one link, with a rule between them. A
   price can only be read against the button it is grouped with. */
(function () {
  "use strict";

  var CENSUS = {
    url:   "https://opensea.io/collection/newyorkers/overview",
    name:  "THE CENSUS RELEASE",
    /* Priced in ETH, so the dollar figure drifts. It moved from $11.14 to $11.24 inside the first
       hour of minting. Never print cents here. */
    meta:  "6,666 · ABOUT $11",
    metaSm: "ABOUT $11",
    cta:   "MINT ON OPENSEA",
    ctaSm:  "OPENSEA",
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
    ctaSm: "TRANSIENT"
  };

  if (document.getElementById("ny-mintbar")) return;
  try { if (sessionStorage.getItem("ny_mintbar_hidden") === "1") return; } catch (e) {}

  var css = document.createElement("style");
  css.textContent = [
    '#ny-mintbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
      'font-family:"Space Grotesk",-apple-system,"Helvetica Neue",Arial,sans-serif;',
      'background:rgba(13,13,13,.96);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
      'border-top:1px solid #2A3040;color:#F0F4F8;',
      'transform:translateY(105%);transition:transform .5s cubic-bezier(.2,.8,.2,1)}',
    '#ny-mintbar.in{transform:translateY(0)}',
    '#ny-mintbar .wrap{display:flex;align-items:stretch;gap:0;max-width:1440px;margin:0 auto;padding:0 14px}',
    '#ny-mintbar .mark{display:flex;align-items:center;padding-right:14px;flex:0 0 auto}',
    '#ny-mintbar .mark img{width:26px;height:26px;display:block}',

    /* one cell per drop: name, price and button inside a single link */
    '#ny-mintbar .drop{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:14px;',
      'padding:10px 16px;text-decoration:none;color:inherit;border-left:1px solid #2A3040;',
      'transition:background .2s}',
    '#ny-mintbar .drop:hover{background:rgba(240,244,248,.04)}',
    '#ny-mintbar .drop .t{min-width:0;flex:1 1 auto}',
    '#ny-mintbar .drop .t b{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;',
      'letter-spacing:.17em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#ny-mintbar .drop .t i{display:block;font-style:normal;font-family:"IBM Plex Mono",Menlo,monospace;',
      'font-size:10.5px;letter-spacing:.1em;color:#8899AA;margin-top:3px;white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis}',
    '#ny-mintbar .drop .cta{flex:0 0 auto;display:inline-flex;align-items:center;font-weight:700;',
      'font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;padding:11px 16px;border-radius:6px;',
      'line-height:1;white-space:nowrap;transition:all .22s cubic-bezier(.2,.8,.2,1)}',
    /* the census button is the loud one while its window is open */
    '#ny-mintbar .drop.census .cta{background:#F0F4F8;color:#0D0D0D}',
    '#ny-mintbar .drop.census.live .cta{background:#D7FF1F;color:#0D0D0D}',
    '#ny-mintbar .drop.census:hover .cta{box-shadow:0 8px 24px rgba(215,255,31,.32)}',
    '#ny-mintbar .drop.key .cta{background:transparent;color:#F0F4F8;border:1px solid rgba(240,244,248,.3)}',
    '#ny-mintbar .drop.key:hover .cta{border-color:#00E5FF;color:#00E5FF}',

    '#ny-mintbar .clock{font-family:"IBM Plex Mono",Menlo,monospace;font-size:10.5px;letter-spacing:.1em;',
      'color:#00E5FF;font-variant-numeric:tabular-nums}',
    '#ny-mintbar .dot{width:7px;height:7px;border-radius:50%;background:#D7FF1F;flex:0 0 auto;',
      'animation:nyblink 1.4s ease-in-out infinite}',
    '@keyframes nyblink{0%,100%{opacity:1}50%{opacity:.25}}',
    '#ny-mintbar .x{flex:0 0 auto;align-self:center;background:none;border:0;color:#8899AA;font-size:17px;',
      'line-height:1;cursor:pointer;padding:6px 4px;margin-left:6px}',
    '#ny-mintbar .x:hover{color:#F0F4F8}',
    '@media (prefers-reduced-motion:reduce){#ny-mintbar,#ny-mintbar .cta,#ny-mintbar .dot{transition:none;animation:none}}',

    /* narrow: the two cells stack, each still holding its own price and its own button */
    '@media (max-width:860px){',
      '#ny-mintbar .wrap{flex-wrap:wrap;padding:0 10px}',
      '#ny-mintbar .mark{display:none}',
      '#ny-mintbar .drop{flex:1 1 100%;border-left:0;padding:9px 4px}',
      '#ny-mintbar .drop.key{border-top:1px solid #2A3040}',
      '#ny-mintbar .drop .t b{font-size:10.5px;letter-spacing:.12em}',
      '#ny-mintbar .drop .t i{font-size:9.5px}',
      '#ny-mintbar .drop .cta{padding:10px 12px;font-size:10.5px;letter-spacing:.1em}',
      '#ny-mintbar .x{display:none}}'
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
  function sm()   { return window.innerWidth < 560; }
  function meta(d){ return sm() ? d.metaSm : d.meta; }
  function cta(d) { return sm() ? d.ctaSm  : d.cta; }

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
      n.innerHTML = CENSUS.name;
      m.innerHTML = meta(CENSUS) + ' · <span class="clock">' + (sm() ? '' : 'OPENS IN ') +
        two(Math.floor(sec / 3600)) + ":" + two(Math.floor(sec / 60) % 60) + ":" + two(sec % 60) + "</span>";
      b.textContent = cta(CENSUS);
      return;
    }
    if (now < CENSUS.close) {
      c.className = "drop census live";
      n.innerHTML = '<span class="dot"></span>' + CENSUS.name;
      m.textContent = sm() ? meta(CENSUS) : (CENSUS.meta + " · MINTING NOW");
      b.textContent = cta(CENSUS);
      return;
    }
    c.className = "drop census";
    n.innerHTML = CENSUS.name;
    m.textContent = sm() ? "CLOSED" : "CLOSED · NEVER REOPENED OR TOPPED UP";
    b.textContent = sm() ? "OPENSEA" : "VIEW ON OPENSEA";
  }

  /* The Keystone cell is static, so it is only redrawn when the viewport crosses the breakpoint. */
  function renderKey() {
    var m = document.getElementById('ny-k-m'), b = document.getElementById('ny-k-c');
    if (!m) return;
    m.textContent = meta(KEY);
    b.textContent = cta(KEY);
  }

  function mount() {
    document.body.appendChild(bar);
    render(); renderKey();
    setInterval(render, 1000);
    var wasSm = sm();
    window.addEventListener('resize', function () {
      if (sm() !== wasSm) { wasSm = sm(); renderKey(); render(); }
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.className += " in"; });
    });
    bar.querySelector(".x").onclick = function () {
      bar.className = bar.className.replace(" in", "");
      try { sessionStorage.setItem("ny_mintbar_hidden", "1"); } catch (e) {}
      setTimeout(function () { bar.parentNode && bar.parentNode.removeChild(bar); }, 500);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
