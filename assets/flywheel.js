/* NEW YORKERS · the flywheel.
   Four loops, one file, no dependencies and no network beyond assets/cast.json.

     SPIN      arrive, meet a stranger, meet another. Novelty, zero commitment.
     WHICH     answer four questions, get a New Yorker who is yours. Identity.
     SHARE     a link that shows your result to whoever opens it, and offers
               them their own. That is the loop that brings the next person.
     HUNT      the easter eggs already in eggs.js, made visible and countable,
               so finding one is worth telling someone about.

   Mount points are data attributes, so a page opts in by putting a div in the
   markup. Nothing here runs on a page that does not ask for it. */
(function () {
  "use strict";
  if (window.NY_FLY) return;

  var CAST_URL = "assets/cast.json";
  var BASE = (window.NY_CONFIG && window.NY_CONFIG.base) || "";
  var SITE = "https://n3wyorkers.com/";
  var EGG_TOTAL_FALLBACK = 14;
  /* THE CENSUS RELEASE on OpenSea: a token page per minted New Yorker, and the mint itself. */
  var KEY_TOKEN = "https://opensea.io/assets/ethereum/0x2dbfcca230979a91863be63ebce55dd5aae2b5c9/", KEY_MINT = "https://transient.xyz/mint/newyorkers";
  var OS_TOKEN = "https://opensea.io/assets/ethereum/0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4/";
  var OS_MINT = "https://opensea.io/collection/newyorkers/overview";

  /* ---------- small helpers ---------- */
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(4, "0"); };
  /* Titles run to 107 characters at the top end, usually "Name, and then a
     whole clause about them". The card can carry that; a share string cannot,
     so cut to the name and let the link do the rest. */
  var shortTitle = function (t) {
    if (t.length <= 46) return t;
    var head = t.split(",")[0];
    return head.length >= 4 && head.length <= 46 ? head : t.slice(0, 44).replace(/\s+\S*$/, "") + "...";
  };
  var el = function (sel, root) { return (root || document).querySelector(sel); };
  var all = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var reduced = function () { return matchMedia("(prefers-reduced-motion: reduce)").matches; };

  /* A stable 32 bit string hash. The quiz has to give the same person the same
     answer every time, or a shared result is a lie. */
  function hash(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  /* ---------- the cast, fetched once, on demand ---------- */
  var castPromise = null;
  function cast() {
    if (!castPromise) {
      castPromise = fetch(BASE + CAST_URL).then(function (r) {
        if (!r.ok) throw new Error("cast " + r.status);
        return r.json();
      }).then(function (d) {
        return d.cast.map(function (r) {
          return { n: r[0], title: r[1], thumb: r[2], family: r[3], borough: r[4], era: r[5], place: r[6] };
        });
      }).catch(function (e) { castPromise = null; throw e; });
    }
    return castPromise;
  }
  var thumbUrl = function (p) { return BASE + "assets/t/" + p.thumb + ".jpg"; };
  var recordUrl = function (p) { return BASE + "n/" + p.n + ".html"; };

  /* ---------- who holds what: api/minted.json (build_mint.py), fetched once, on demand ---------- */
  var mintedPromise = null;
  function minted() {
    if (!mintedPromise) {
      mintedPromise = fetch(BASE + "api/minted.json?v=" + Math.floor(Date.now() / 9e5)).then(function (r) {
        if (!r.ok) throw new Error("minted " + r.status);
        return r.json();
      }).catch(function (e) { mintedPromise = null; throw e; });
    }
    return mintedPromise;
  }

  /* ---------- share ---------- */
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "fly-toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("on"); });
    setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  function share(opts) {
    var text = opts.text || "";
    var url = opts.url || location.href;
    if (navigator.share) {
      navigator.share({ title: opts.title || "NEW YORKERS", text: text, url: url })
        .catch(function () { /* the sheet was dismissed, which is not an error */ });
      return;
    }
    var payload = text ? text + "\n" + url : url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload)
        .then(function () { toast("Copied. Go paste it somewhere."); })
        .catch(function () { window.prompt("Copy this", payload); });
    } else {
      window.prompt("Copy this", payload);
    }
  }
  function xIntent(text, url) {
    return "https://x.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
  }

  /* ---------- SPIN: meet a stranger ---------- */
  function mountSpin(node) {
    var current = null;
    node.innerHTML =
      '<figure class="fly-spin-art"><a class="fly-spin-link" href="#"><img alt="" width="640" height="360"></a></figure>' +
      '<div class="fly-spin-meta">' +
        '<p class="fly-kicker">SAY HELLO TO</p>' +
        '<h3 class="fly-spin-name"></h3>' +
        '<p class="fly-spin-where"></p>' +
        '<div class="fly-spin-btns">' +
          '<button type="button" class="fly-btn fly-again">Meet another <span aria-hidden="true">↻</span></button>' +
          '<a class="fly-btn ghost fly-spin-open" href="#">Their record ↗</a>' +
        '</div>' +
      '</div>';
    var img = el("img", node), link = el(".fly-spin-link", node), name = el(".fly-spin-name", node),
        where = el(".fly-spin-where", node), open = el(".fly-spin-open", node), again = el(".fly-again", node);
    var live = document.createElement("p");
    live.className = "fly-sr";
    live.setAttribute("aria-live", "polite");
    node.appendChild(live);

    function paint(list) {
      current = list[Math.floor(Math.random() * list.length)];
      img.src = thumbUrl(current);
      img.alt = current.title + ", number " + current.n + ", painted by MLow";
      link.href = open.href = recordUrl(current);
      name.textContent = current.title;
      where.textContent = [current.family, current.borough || "Citywide", current.place].filter(Boolean).join(" · ");
      node.querySelector(".fly-kicker").textContent = "NO. " + pad(current.n);
      live.textContent = "Now showing " + current.title + ", number " + current.n + ".";
      if (!reduced()) { node.classList.remove("dealt"); void node.offsetWidth; node.classList.add("dealt"); }
    }
    again.onclick = function () { cast().then(paint); };
    cast().then(paint).catch(function () { node.remove(); });
  }

  /* ---------- WHICH NEW YORKER ARE YOU ---------- */
  /* Every option pushes weight at one or more of the thirteen families, and a
     few also pick a borough. The result is a real filter over the census, not
     a lookup table of twelve hand written answers, so it stays fresh at 7,541. */
  var QUIZ = [
    {
      q: "It is 2am. Where are you actually?",
      a: [
        { t: "Still out. The night is young and so am I.", f: { Degens: 3, Hustlers: 2 } },
        { t: "On the last train home, staring at nothing.", f: { Underground: 3, Citizens: 2 } },
        { t: "Working. Somebody has to.", f: { Builders: 3, Process: 2 } },
        { t: "Asleep. I have a life.", f: { Stoop: 3, Transplants: 1 } }
      ]
    },
    {
      q: "The train has been sitting between stations for twenty minutes.",
      a: [
        { t: "I announce the situation to the car.", f: { Heroes: 2, Citizens: 2 } },
        { t: "I have not looked up once.", f: { Design: 2, Process: 2 } },
        { t: "I am already off, walking, faster than this thing.", f: { Hustlers: 3 } },
        { t: "Honestly? I like it down here.", f: { Underground: 3, Strays: 1 } }
      ]
    },
    {
      q: "Pick your corner.",
      a: [
        { t: "A downtown block that used to be something else.", b: "Manhattan", f: { Places: 2, Villains: 1 } },
        { t: "A brownstone stoop in the good light.", b: "Brooklyn", f: { Stoop: 3 } },
        { t: "Under the 7, where the whole world is eating.", b: "Queens", f: { Transplants: 3 } },
        { t: "Uptown, where the music started.", b: "Bronx", f: { Heroes: 2, Design: 1 } },
        { t: "The ferry. Free, and nobody bothers me.", b: "Staten Island", f: { Places: 2, Strays: 1 } }
      ]
    },
    {
      q: "Be honest about your role in this city.",
      a: [
        { t: "I built something here.", f: { Builders: 3, Design: 2 } },
        { t: "I am getting away with something.", f: { Villains: 3, Degens: 2 } },
        { t: "I showed up and never left.", f: { Transplants: 3, Citizens: 1 } },
        { t: "I keep an eye on things.", f: { Strays: 3, Places: 1 } }
      ]
    }
  ];

  var VERDICT = {
    Places: "You are less a person here than a location people agree on.",
    Citizens: "You are the baseline. The city is mostly you and it forgets to say thank you.",
    Builders: "You left something standing. That is rarer here than money.",
    Degens: "You are having a wonderful time and it is going to cost you.",
    Underground: "You are at your best below street level.",
    Design: "You noticed how it looked before you noticed what it was.",
    Stoop: "You hold the block together by sitting on it.",
    Hustlers: "You have never once waited for the light to change.",
    Heroes: "You did the thing while everyone else filmed it.",
    Villains: "Every census needs you. This one put you in a frame.",
    Transplants: "You were not born here. You are here. That settles it.",
    Process: "You are how the city actually works, and nobody thanks the plumbing.",
    Strays: "You were never counted and you were always here."
  };

  function pickFor(answers, list) {
    var score = {}, borough = "", i, k, opt;
    for (i = 0; i < answers.length; i++) {
      opt = QUIZ[i].a[answers[i]];
      if (!opt) continue;
      if (opt.b) borough = opt.b;
      for (k in opt.f) score[k] = (score[k] || 0) + opt.f[k];
    }
    var family = Object.keys(score).sort(function (a, b) {
      return score[b] - score[a] || (a < b ? -1 : 1);
    })[0] || "Citizens";

    var pool = list.filter(function (p) { return p.family === family && p.borough === borough; });
    if (pool.length < 3) pool = list.filter(function (p) { return p.family === family; });
    if (pool.length < 3) pool = list;
    var seed = hash(answers.join("-") + "|" + family + "|" + borough);
    return { person: pool[seed % pool.length], family: family, borough: borough };
  }

  function resultCard(res, node, opts) {
    var p = res.person;
    var url = SITE + "?iam=" + p.n;
    var text = 'I am No. ' + pad(p.n) + ', ' + shortTitle(p.title) + '. Which New Yorker are you?';
    node.innerHTML =
      '<div class="fly-result">' +
        '<figure><a href="' + esc(recordUrl(p)) + '"><img src="' + esc(thumbUrl(p)) + '" width="640" height="360" alt="' + esc(p.title) + ', number ' + p.n + ', painted by MLow"></a></figure>' +
        '<div class="fly-result-copy">' +
          '<p class="fly-kicker">' + (opts && opts.theirs ? "THEY ARE" : "YOU ARE") + ' NO. ' + pad(p.n) + '</p>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p class="fly-verdict">' + esc(VERDICT[res.family] || "") + '</p>' +
          '<p class="fly-where">' + esc([res.family, p.borough || "Citywide", p.place].filter(Boolean).join(" · ")) + '</p>' +
          '<div class="fly-spin-btns">' +
            '<button type="button" class="fly-btn fly-share">Share this <span aria-hidden="true">↗</span></button>' +
            '<a class="fly-btn ghost" href="' + esc(xIntent(text, url)) + '" target="_blank" rel="noopener">Post on X</a>' +
            '<button type="button" class="fly-btn ghost fly-retake">' + (opts && opts.theirs ? "Find mine" : "Take it again") + '</button>' +
            '<button type="button" class="fly-btn ghost fly-card">' + (opts && opts.theirs ? "Save their census card" : "Save my census card") + '</button>' +
            '<span class="fly-mint"></span>' +
          '</div>' +
          '<p class="fly-mint-line"></p>' +
          '<p class="fly-fine"><a href="' + esc(recordUrl(p)) + '">Read the full record ↗</a></p>' +
        '</div>' +
      '</div>';
    el(".fly-share", node).onclick = function () {
      share({ title: "NEW YORKERS", text: text, url: url });
    };
    el(".fly-card", node).onclick = function () { bureauCard(p, res, opts && opts.theirs ? "THEY ARE NO. " : "YOU ARE NO. "); };
    /* The result leads to the chain: an offer on the token when this New Yorker is minted, the mint when
       it is still in THE CENSUS RELEASE pool, nothing for Era I, which is never sold. */
    minted().then(function (d) {
      var slot = el(".fly-mint", node), line = el(".fly-mint-line", node);
      if (!slot || !line) return;
      var m = d.census && d.census[String(p.n)], k = d.keystone && d.keystone[String(p.n)];
      if (m) {
        slot.innerHTML = '<a class="fly-btn mint" href="' + esc(OS_TOKEN + m.t) + '" target="_blank" rel="noopener">Make an offer on No. ' + pad(p.n) + '</a>';
      } else if (k) {
        slot.innerHTML = '<a class="fly-btn mint" href="' + esc(KEY_TOKEN + k.t) + '" target="_blank" rel="noopener">Make an offer on Keystone No. ' + pad(p.n) + '</a>';
      } else if (d.k111 && d.k111.indexOf(p.n) !== -1) {
        slot.innerHTML = '<a class="fly-btn mint" href="' + KEY_MINT + '" target="_blank" rel="noopener">Mint a Keystone on Transient</a>';
        line.textContent = "A founding New Yorker. Dynamic ones of one, 0.069 ETH.";
      } else if (p.era >= 2 && p.era <= 19) {
        var inPool = !d.pool || d.pool.indexOf(p.n) !== -1;
        slot.innerHTML = '<a class="fly-btn mint" href="' + OS_MINT + '" target="_blank" rel="noopener">Mint a New Yorker</a>';
        line.textContent = inPool ? "Mints are dealt in order, you might get this one." : "This one is not in THE CENSUS RELEASE. Not its turn yet.";
      }
    }).catch(function () { /* no chain data, the card stands on its own */ });
    return { url: url, text: text };
  }

  /* ---------- THE BUREAU CARD: a 1080 x 1350 PNG of the result, drawn here, shared or saved ---------- */
  function fontOf(fam, fallback) {
    try { return document.fonts && document.fonts.check('16px "' + fam + '"') ? '"' + fam + '", ' + fallback : fallback; } catch (e) { return fallback; }
  }
  function bureauCard(p, res, lead) {
    var W = 1080, H = 1350, c = document.createElement("canvas"), g = c.getContext("2d");
    c.width = W; c.height = H;
    var serif = fontOf("Fraunces", "Georgia, serif"), mono = fontOf("IBM Plex Mono", "Menlo, monospace"),
        sans = fontOf("Space Grotesk", "Helvetica, Arial, sans-serif");
    var img = new Image();
    img.crossOrigin = "anonymous";          /* assets/t is same origin; set anyway so the canvas stays clean */
    img.onload = function () { draw(img); };
    img.onerror = function () { draw(null); };
    img.src = thumbUrl(p);
    function spaced(t, x, y, sp) { for (var i = 0; i < t.length; i++) { g.fillText(t[i], x, y); x += g.measureText(t[i]).width + sp; } }
    function wrap(t, x, y, maxW, lh, maxLines) {
      var words = t.split(" "), line = "", lines = [], i;
      for (i = 0; i < words.length; i++) {
        var test = line ? line + " " + words[i] : words[i];
        if (g.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
      }
      lines.push(line);
      if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, "") + "..."; }
      for (i = 0; i < lines.length; i++) g.fillText(lines[i], x, y + i * lh);
      return lines.length;
    }
    function stamp(cx, cy, r) {
      g.save(); g.translate(cx, cy); g.rotate(-12 * Math.PI / 180);
      g.strokeStyle = g.fillStyle = "#ECC981"; g.lineWidth = 6;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r - 14, 0, Math.PI * 2); g.stroke();
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "700 44px " + sans; g.fillText("COUNTED", 0, -8);
      g.font = "500 16px " + mono; g.fillText("NO. " + pad(p.n), 0, 34);
      g.restore();
    }
    function draw(im) {
      g.fillStyle = "#080D16"; g.fillRect(0, 0, W, H);
      if (im) {                              /* cover into the top 1080 x 720 */
        var s = Math.max(W / im.naturalWidth, 720 / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
        g.drawImage(im, (W - w) / 2, (720 - h) / 2, w, h);
      } else { g.fillStyle = "#0F1A26"; g.fillRect(0, 0, W, 720); }
      var grd = g.createLinearGradient(0, 580, 0, 720);
      grd.addColorStop(0, "rgba(8,13,22,0)"); grd.addColorStop(1, "#080D16");
      g.fillStyle = grd; g.fillRect(0, 580, W, 140);
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillStyle = "#8FA7AB"; g.font = "500 22px " + mono; spaced("NEW YORKERS CENSUS BUREAU", 72, 796, 6);
      g.fillStyle = "#ECE8DD"; g.font = "700 84px " + sans; g.fillText(lead + pad(p.n), 72, 892);
      g.font = "500 52px " + serif; var n = wrap(p.title, 72, 970, 700, 60, 3);
      g.fillStyle = "#8FA7AB"; g.font = "500 22px " + mono;
      spaced([res.family || p.family, p.borough || "Citywide"].filter(Boolean).join("  ·  ").toUpperCase(), 72, Math.max(1110, 990 + n * 60), 4);
      g.fillStyle = "#ECC981"; spaced("n3wyorkers.com", 72, 1286, 4);
      stamp(900, 1176, 120);
      c.toBlob(function (b) { if (b) deliver(b, "new-yorker-" + pad(p.n) + ".png"); }, "image/png");
    }
  }
  function deliver(blob, name) {
    var file = null;
    try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "NEW YORKERS", text: "I got counted." }).catch(function () {});
      return;
    }
    var a = document.createElement("a"), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 2000);
    toast("Saved. Your census card is in your downloads.");
  }

  function mountQuiz(node) {
    var answers = [], step = 0;

    function paintStep() {
      if (step >= QUIZ.length) return finish();
      var q = QUIZ[step];
      node.innerHTML =
        '<div class="fly-quiz">' +
          '<p class="fly-kicker">QUESTION ' + (step + 1) + ' OF ' + QUIZ.length + '</p>' +
          '<h3>' + esc(q.q) + '</h3>' +
          '<ul class="fly-options">' + q.a.map(function (o, i) {
            return '<li><button type="button" data-i="' + i + '">' + esc(o.t) + '</button></li>';
          }).join("") + '</ul>' +
          (step ? '<button type="button" class="fly-back">← Back</button>' : "") +
          '<div class="fly-progress" aria-hidden="true"><i style="width:' + Math.round((step / QUIZ.length) * 100) + '%"></i></div>' +
        '</div>';
      all("button[data-i]", node).forEach(function (b) {
        b.onclick = function () {
          answers[step] = Number(b.dataset.i);
          step++;
          paintStep();
          var h = el("h3", node); if (h) h.focus();
        };
      });
      var back = el(".fly-back", node);
      if (back) back.onclick = function () { step--; paintStep(); };
    }

    function finish() {
      node.innerHTML = '<p class="fly-loading">Counting you.</p>';
      cast().then(function (list) {
        var res = pickFor(answers, list);
        resultCard(res, node, {});
        el(".fly-retake", node).onclick = function () { answers = []; step = 0; paintStep(); };
        try { localStorage.setItem("ny_iam", String(res.person.n)); } catch (e) {}
      }).catch(function () {
        node.innerHTML = '<p class="fly-loading">The census is not answering. <a href="' + BASE + 'census.html">Browse it directly ↗</a></p>';
      });
    }
    paintStep();
  }

  /* A shared ?iam=NNNN link shows that person's result first, then offers the
     reader their own. This is the whole acquisition loop in one branch. */
  function mountShared(node, n) {
    node.innerHTML = '<p class="fly-loading">Looking them up.</p>';
    cast().then(function (list) {
      var p = list.filter(function (x) { return x.n === n; })[0];
      if (!p) return mountQuiz(node);
      resultCard({ person: p, family: p.family, borough: p.borough }, node, { theirs: true });
      el(".fly-retake", node).onclick = function () { mountQuiz(node); };
    }).catch(function () { mountQuiz(node); });
  }

  /* ---------- HUNT: the eggs, made countable ---------- */
  function eggsFound() {
    try { return JSON.parse(localStorage.getItem("ny_eggs") || "[]"); } catch (e) { return []; }
  }
  function eggTotal() { return window.NY_EGGS_TOTAL || EGG_TOTAL_FALLBACK; }

  function mountHunt(node) {
    function paint() {
      var found = eggsFound(), total = eggTotal(), n = found.length;
      var text = n
        ? "I have found " + n + " of the " + total + " things hidden in NEW YORKERS."
        : "There are " + total + " things hidden in NEW YORKERS. I have found none of them yet.";
      node.innerHTML =
        '<div class="fly-hunt' + (n ? " on" : "") + '">' +
          '<p class="fly-kicker">THE HUNT</p>' +
          '<p class="fly-hunt-count"><b>' + n + '</b> <span>of ' + total + ' found</span></p>' +
          '<div class="fly-pips" aria-hidden="true">' +
            Array.from({ length: total }, function (_, i) {
              return '<i class="' + (i < n ? "on" : "") + '"></i>';
            }).join("") +
          '</div>' +
          '<p class="fly-hunt-copy">' + (n
            ? "Something responded. There are " + (total - n) + " more, and none of them are labelled."
            : "Type a word this city would recognise. Click the eye five times. The rest is yours to work out.") +
          '</p>' +
          (n ? '<button type="button" class="fly-btn ghost fly-hunt-share">Share the count ↗</button>' : "") +
        '</div>';
      var b = el(".fly-hunt-share", node);
      if (b) b.onclick = function () { share({ title: "NEW YORKERS", text: text, url: SITE }); };
    }
    paint();
    addEventListener("storage", paint);
    /* eggs.js writes localStorage in the same tab, where storage does not fire. */
    setInterval(paint, 4000);
  }

  /* ---------- boot ---------- */
  function boot() {
    all("[data-fly]").forEach(function (node) {
      var kind = node.dataset.fly;
      if (kind === "spin") return mountSpin(node);
      if (kind === "hunt") return mountHunt(node);
      if (kind === "quiz") {
        var n = Number(new URLSearchParams(location.search).get("iam"));
        return n ? mountShared(node, n) : mountQuiz(node);
      }
    });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NY_FLY = { cast: cast, share: share, spin: mountSpin, quiz: mountQuiz, hunt: mountHunt, eggsFound: eggsFound };
})();
