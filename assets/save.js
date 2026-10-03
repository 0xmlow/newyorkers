/* SAVE AND POST: every state of a piece, as the real file, ready to post on X.
   Rendered on n/<id> pages by build_seo.py into <div id="saveart">, with the data inline as window.NY_SAVE:
     {n, name, page, s:[{k, sub, ext, u:[url, url, ...]}]}
   u lists the same file on several hosts (IPFS gateways for minted tokens), tried in order.
   SAVE fetches the file and downloads it under a readable name. On a phone that can share files,
   SHARE hands the file itself to the share sheet, so X (or Save Video, Save Image) gets the art attached.
   POST ON X opens a post with the line and the piece link; the saved file is then attached by hand,
   because X's post intent cannot carry media. */
(function () {
  var D = window.NY_SAVE, box = document.getElementById("saveart");
  if (!D || !box || !D.s || !D.s.length) return;
  var MIME = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", mp4: "video/mp4" };
  var kinds = {}; D.s.forEach(function (s) { kinds[s.k] = (kinds[s.k] || 0) + 1; });
  function label(i) { var s = D.s[i]; if (kinds[s.k] < 2) return s.k; var n = 0; for (var j = 0; j <= i; j++) if (D.s[j].k === s.k) n++; return s.k + " " + n; }
  function slug(t) { return String(t).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function fname(i) { return "NEW-YORKERS-" + D.n + "-" + slug(D.name) + "-" + slug(label(i)) + "." + D.s[i].ext; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var touch = matchMedia("(pointer:coarse)").matches;

  box.innerHTML =
    '<div class="kicker" style="font-size:10px">Save it, post it</div>' +
    '<h2>Every state of this piece</h2>' +
    '<p>Pick a state, save the file, post it. ' + (touch ? "SHARE sends the file straight to X or to your camera roll." : "Save first, then attach the file to your post.") + '</p>' +
    '<div class="sv-chips" role="toolbar" aria-label="States"></div>' +
    '<div class="sv-stage"></div>' +
    '<div class="sv-act"><button type="button" class="btn sv-save">SAVE</button>' +
    (touch && navigator.canShare ? '<button type="button" class="btn ghost sv-share">SHARE</button>' : "") +
    '<a class="btn ghost sv-x" target="_blank" rel="noopener">POST ON X</a><span class="sv-msg" aria-live="polite"></span></div>';
  var chips = box.querySelector(".sv-chips"), stage = box.querySelector(".sv-stage"), msg = box.querySelector(".sv-msg");
  var cur = 0, blobs = {};

  function xHref(i) {
    var t = D.name + " · " + label(i) + ". NEW YORKERS by MLow.";
    return "https://x.com/intent/post?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(D.page);
  }
  function show(i) {
    cur = i; msg.textContent = "";
    [].forEach.call(chips.children, function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    var s = D.s[i], el;
    if (s.ext === "mp4") { el = document.createElement("video"); el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.setAttribute("playsinline", ""); }
    else { el = document.createElement("img"); el.alt = D.name + ", " + label(i); el.decoding = "async"; }
    var n = 0; el.addEventListener("error", function () { if (++n < s.u.length) el.src = s.u[n]; });
    el.src = s.u[0]; stage.innerHTML = ""; stage.appendChild(el);
    box.querySelector(".sv-x").href = xHref(i);
  }
  // the file itself, from the first host that answers; kept so SAVE then SHARE does not fetch twice
  function get(i) {
    if (blobs[i]) return Promise.resolve(blobs[i]);
    var s = D.s[i], n = 0;
    function tryNext() {
      if (n >= s.u.length) return Promise.reject(new Error("no host answered"));
      var u = s.u[n++], ctl = window.AbortController ? new AbortController() : null, t = ctl && setTimeout(function () { ctl.abort(); }, 30000);
      return fetch(u, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.blob(); })
        .catch(function () { clearTimeout(t); return tryNext(); });
    }
    return tryNext().then(function (b) { blobs[i] = new Blob([b], { type: MIME[s.ext] || b.type }); return blobs[i]; });
  }
  function busy(t) { msg.textContent = t; }
  box.querySelector(".sv-save").addEventListener("click", function () {
    var i = cur; busy("SAVING…");
    get(i).then(function (b) {
      var a = document.createElement("a"), u = URL.createObjectURL(b);
      a.href = u; a.download = fname(i); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 60000); busy("SAVED " + fname(i));
    }).catch(function () { busy("Opened in a new tab. Save it from there."); window.open(D.s[i].u[0], "_blank", "noopener"); });
  });
  var sh = box.querySelector(".sv-share");
  if (sh) sh.addEventListener("click", function () {
    var i = cur; busy("GETTING THE FILE…");
    get(i).then(function (b) {
      var f = new File([b], fname(i), { type: b.type });
      if (!navigator.canShare({ files: [f] })) throw new Error("cannot share files");
      busy(""); return navigator.share({ files: [f], text: D.name + " · " + label(i) + ". NEW YORKERS by MLow. " + D.page });
    }).catch(function (e) { if (e && e.name === "AbortError") { busy(""); return; } busy("Sharing a file is not supported here. Use SAVE."); });
  });
  D.s.forEach(function (s, i) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = label(i) + (s.sub && s.k !== "ANIMATED" && s.k !== "VHS GLITCH" ? " · " + s.sub.split(" · ")[0] : "");
    b.addEventListener("click", function () { show(i); }); chips.appendChild(b);
  });
  var h = /[#&]save=([A-Z0-9 ]+)/i.exec(decodeURIComponent(location.hash));
  var start = 0; if (h) D.s.forEach(function (s, i) { if (!start && label(i).toUpperCase() === h[1].toUpperCase()) start = i; });
  show(start);
  if (/[#&]save/.test(location.hash)) box.scrollIntoView({ block: "start" });
})();
