/* phone-gpu.js, NEW YORKERS: keeps a walkable gallery inside a phone's memory.

   iOS Safari closes a tab that holds much more than about a gigabyte, and on a phone the GPU shares that memory. Measured
   2026-10-18 as an iPhone, MoMLOW asked for 1.1 GB of textures at its door and MEME ISLAND 1.17 GB, so they crashed.
   This file runs before any engine. On a phone (a coarse pointer or a mobile user agent) every image texture wider or
   taller than the cap is halved until it fits, at upload, inside WebGL itself, so one file serves every engine on the
   site, three r128 to r185, with no engine edits. Halving keeps powers of two powers of two, so mipmaps stay legal.

   Images only (img, ImageBitmap, canvas). Video, data arrays, compressed textures, cube maps and render targets pass
   through untouched. On WebGL2, three r150 and later allocate with texStorage2D before the pixels arrive, so that
   allocation waits for the first upload to learn whether it is an image (shrunk) or anything else (left whole).

   data-cap on the script tag sets the cap (512 if absent). data-art is a pattern for image URLs that are the art
   itself, which get data-artcap instead (1024 if absent). ?gpucap=0 turns it off, ?gpucap=N tries another cap,
   and it runs on a laptop too when ?gpucap is given. Without data-cap, window.__PHONE_GPU = {cap, art, artcap} is read. window.__GPUCAP reports what it did. */
(function () {
  var s = document.currentScript, q = /[?&]gpucap=(\d+)/.exec(location.search);
  var phone = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  var d = (s && s.dataset && s.dataset.cap ? s.dataset : window.__PHONE_GPU) || {};
  var CAP = q ? +q[1] : phone ? +(d.cap || 512) : 0;
  var ART = d.art ? new RegExp(d.art) : null, ARTCAP = Math.max(CAP, +(d.artcap || 1024));
  var R = window.__GPUCAP = { cap: CAP, artcap: ART ? ARTCAP : null, shrunk: 0, savedMB: 0 };
  if (!CAP || !window.WebGLRenderingContext) return;

  var T2D = 0x0DE1, FLIP = 0x9240;
  var has = function (C) { return typeof window[C] !== "undefined"; };
  var isBitmap = function (x) { return has("ImageBitmap") && x instanceof ImageBitmap; };
  var isImg = function (x) {
    return !!x && ((has("HTMLImageElement") && x instanceof HTMLImageElement) || isBitmap(x) ||
      (has("HTMLCanvasElement") && x instanceof HTMLCanvasElement) || (has("OffscreenCanvas") && x instanceof OffscreenCanvas));
  };
  var size = function (x) { return [x.naturalWidth || x.width || 0, x.naturalHeight || x.height || 0]; };
  var capFor = function (x) { return ART && x && x.src && ART.test(x.src) ? ARTCAP : CAP; };
  var factor = function (w, h, cap) { var f = 1; while (Math.max(w, h) / f > cap) f *= 2; return f; };

  // one scratch canvas, emptied after every upload: iOS caps the memory all canvases may hold together
  var scratch = null;
  function shrink(src, f, flip) {
    var z = size(src), w = Math.max(1, Math.floor(z[0] / f)), h = Math.max(1, Math.floor(z[1] / f));
    var c = scratch || (scratch = document.createElement("canvas"));
    c.width = w; c.height = h;
    var x = c.getContext("2d");
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    // WebGL ignores UNPACK_FLIP_Y for an ImageBitmap but obeys it for a canvas: flip here so the two cancel
    if (flip && isBitmap(src)) { x.translate(0, h); x.scale(1, -1); }
    x.drawImage(src, 0, 0, w, h);
    R.shrunk++; R.savedMB = Math.round(R.savedMB + (z[0] * z[1] - w * h) * 5.3 / 1048576);
    return c;
  }
  var done = function () { if (scratch) { scratch.width = 1; scratch.height = 1; } };

  function patch(P) {
    if (!P || P.__phoneGpu) return; P.__phoneGpu = 1;
    var o = {};
    ["pixelStorei", "activeTexture", "bindTexture", "texImage2D", "texSubImage2D", "texStorage2D", "generateMipmap",
      "framebufferTexture2D", "copyTexSubImage2D", "copyTexImage2D", "compressedTexSubImage2D"].forEach(function (k) { o[k] = P[k]; });
    var info = new WeakMap();   // texture: { f: shrink factor, pend: deferred texStorage2D args }
    var st = function (gl) { return gl.__pg || (gl.__pg = { flip: false, unit: 0x84C0, b: {} }); };
    var cur = function (gl) { return st(gl).b[st(gl).unit]; };
    var get = function (tex) { var i = tex && info.get(tex); if (tex && !i) info.set(tex, i = { f: 1 }); return i; };

    function flush(gl, tex, img) {
      var i = get(tex); if (!i || !i.pend) return i;
      var p = i.pend; i.pend = null; var w = p[3], h = p[4], lv = p[1];
      i.f = img ? factor(w, h, capFor(img)) : 1;
      if (i.f > 1) { w = Math.max(1, Math.floor(w / i.f)); h = Math.max(1, Math.floor(h / i.f)); lv = Math.min(lv, Math.floor(Math.log2(Math.max(w, h))) + 1); }
      o.texStorage2D.call(gl, p[0], lv, p[2], w, h);
      return i;
    }

    P.pixelStorei = function (p, v) { if (p === FLIP) st(this).flip = !!v; return o.pixelStorei.call(this, p, v); };
    P.activeTexture = function (u) { st(this).unit = u; return o.activeTexture.call(this, u); };
    P.bindTexture = function (t, tex) { if (t === T2D) st(this).b[st(this).unit] = tex; return o.bindTexture.call(this, t, tex); };

    P.texImage2D = function () {
      var a = Array.prototype.slice.call(arguments);
      if (a[0] === T2D) {
        var tex = cur(this), i = get(tex), src = a.length === 6 ? a[5] : a.length >= 9 ? a[8] : null;
        if (isImg(src)) {
          var z = size(src);
          if (a[1] === 0 && i) i.f = factor(z[0], z[1], capFor(src));
          var f = i ? i.f : 1;
          if (f > 1) {
            var c = shrink(src, f, st(this).flip);
            if (a.length === 6) a[5] = c; else { a[3] = c.width; a[4] = c.height; a[8] = c; }
            try { return o.texImage2D.apply(this, a); } finally { done(); }
          }
        } else if (a[1] === 0 && i) i.f = 1;
      }
      return o.texImage2D.apply(this, a);
    };

    if (o.texStorage2D) P.texStorage2D = function (t, lv, fmt, w, h) {
      var tex = t === T2D ? cur(this) : null;
      if (tex && Math.max(w, h) > CAP) { get(tex).pend = [t, lv, fmt, w, h]; return; }
      return o.texStorage2D.call(this, t, lv, fmt, w, h);
    };

    P.texSubImage2D = function () {
      var a = Array.prototype.slice.call(arguments);
      if (a[0] === T2D) {
        var src = a.length === 7 ? a[6] : a.length === 9 ? a[8] : null, img = isImg(src) ? src : null;
        var i = flush(this, cur(this), a[1] === 0 ? img : null);
        if (i && i.f > 1) {
          if (!img) return;   // a non image into a shrunk texture cannot line up; skip rather than throw
          var f = i.f, c = shrink(img, f, st(this).flip);
          a[2] = Math.floor(a[2] / f); a[3] = Math.floor(a[3] / f);
          if (a.length === 7) a[6] = c; else { a[4] = c.width; a[5] = c.height; a[8] = c; }
          try { return o.texSubImage2D.apply(this, a); } finally { done(); }
        }
      }
      return o.texSubImage2D.apply(this, a);
    };

    var plain = function (k, tgt) {
      if (!o[k]) return;
      P[k] = function () { if (arguments[tgt] === T2D) flush(this, cur(this), null); return o[k].apply(this, arguments); };
    };
    plain("generateMipmap", 0); plain("copyTexSubImage2D", 0); plain("compressedTexSubImage2D", 0);

    P.framebufferTexture2D = function (fb, att, tt, tex, lv) {
      var i = tex && info.get(tex);
      if (i && i.pend) {
        var was = cur(this);
        o.bindTexture.call(this, T2D, tex); flush(this, tex, null); o.bindTexture.call(this, T2D, was || null);
      }
      return o.framebufferTexture2D.call(this, fb, att, tt, tex, lv);
    };
  }

  patch(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) patch(WebGL2RenderingContext.prototype);
})();
