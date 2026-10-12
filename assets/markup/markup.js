/* MARK UP A NEW YORKER. Draw over any piece in the NEW YORKERS census, save it with the marks of the house.

   The brushes, the mood lerp and the flow field come from MLow's moodroom (github.com/0xmlow/moodroom).
   Here the canvas is a painting: the painting layer and the ink layer are kept apart so CLEAR and UNDO
   never touch the art, and SAVE composites both over a caption strip carrying the MLOW and N3W YORKERS
   marks, the piece, and "MARKED UP BY @handle" when the visitor gives one.

   Configure before this script runs (index.html and the site page both do):
     window.MK_CONFIG = {
       base: 'https://n3wyorkers.com/',   // where assets/t/<thumb>.jpg, assets/markup/* and the pages live
       site: 'https://n3wyorkers.com',    // the public address used in share links
       defaultId: '578'                   // the piece a bare visit opens
     }
   Needs: window.MK_LOGOS (logos.js) and <base>assets/markup/idx.js + cards.json, published by the site. */
(function () {
'use strict';
const CFG = window.MK_CONFIG || {};
const B = CFG.base || '', SITE = CFG.site || 'https://n3wyorkers.com', DEFAULT_ID = String(CFG.defaultId || '37');
const $ = (id) => document.getElementById(id);
const art = $('mkArt'), ink = $('mkInk'), ac = art.getContext('2d'), ic = ink.getContext('2d');
let W = 1000, H = 563, K = W / 900, piece = null, img = null, dirty = false;

/* ---------- store: the handle is remembered on this device only ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
  set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} }
};

/* ---------- moods: NYC hours ---------- */
const MOODS = {
  census:   { n: 'The Count',      bg1: [10, 12, 8],  bg2: [26, 32, 14], accent: [215, 255, 31] },
  rush:     { n: 'Rush Hour',      bg1: [30, 16, 4],  bg2: [62, 34, 8],  accent: [255, 176, 32] },
  bodega:   { n: '3 AM Bodega',    bg1: [24, 4, 14],  bg2: [48, 10, 30], accent: [255, 46, 99] },
  snow:     { n: 'Snow Day',       bg1: [14, 20, 30], bg2: [40, 52, 68], accent: [214, 234, 255] },
  hydrant:  { n: 'Hydrant Summer', bg1: [4, 20, 28],  bg2: [8, 44, 58],  accent: [0, 229, 255] },
  blackout: { n: "Blackout '77",   bg1: [4, 3, 2],    bg2: [22, 10, 4],  accent: [255, 96, 32] }
};
let mood = 'census';
let liveBg1 = MOODS.census.bg1.slice(), liveBg2 = MOODS.census.bg2.slice(), liveAc = MOODS.census.accent.slice();
const lerp = (a, b, t) => a + (b - a) * t;
const lerpC = (c, d, t) => c.map((v, i) => lerp(v, d[i], t));
const rgb = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')';

/* ---------- the flow field behind the frame ---------- */
const bg = $('mkBg'), bc = bg.getContext('2d'), stage = $('mkStage');
let bw = 0, bh = 0, ring = 0, visible = true;
function sizeBg() { const r = stage.getBoundingClientRect(); bw = bg.width = Math.max(1, r.width | 0); bh = bg.height = Math.max(1, r.height | 0); }
const parts = [];
function Part() { this.reset(); }
Part.prototype.reset = function () { this.x = Math.random() * bw; this.y = Math.random() * bh; this.s = 1 + Math.random() * 2.5; this.v = .3 + Math.random() * .7; this.l = 0; this.m = 300 + Math.random() * 400; };
Part.prototype.step = function (t) {
  const a = Math.sin(this.x * .002 + t * .0003) * Math.PI + Math.cos(this.y * .002 + t * .0002) * Math.PI;
  this.x += Math.cos(a) * this.v; this.y += Math.sin(a) * this.v; this.l++;
  if (this.l > this.m || this.x < -20 || this.x > bw + 20 || this.y < -20 || this.y > bh + 20) this.reset();
  bc.fillStyle = rgb(liveAc, Math.sin(this.l / this.m * Math.PI) * .5);
  bc.beginPath(); bc.arc(this.x, this.y, this.s, 0, 6.2832); bc.fill();
};
const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(t) {
  const M = MOODS[mood];
  liveBg1 = lerpC(liveBg1, M.bg1, .03); liveBg2 = lerpC(liveBg2, M.bg2, .03); liveAc = lerpC(liveAc, M.accent, .03);
  const g = bc.createRadialGradient(bw / 2, bh / 2, 0, bw / 2, bh / 2, bw * .7);
  g.addColorStop(0, rgb(liveBg2)); g.addColorStop(1, rgb(liveBg1)); bc.fillStyle = g; bc.fillRect(0, 0, bw, bh);
  if (!still) {
    ring += .006;
    for (let i = 0; i < 5; i++) { const p = (ring + i * .2) % 1; bc.strokeStyle = rgb(liveAc, (1 - p) * .06); bc.lineWidth = 1.5; bc.beginPath(); bc.arc(bw / 2, bh / 2, p * bw * .6, 0, 6.2832); bc.stroke(); }
    parts.forEach((p) => p.step(t));
  }
  if (visible) requestAnimationFrame(frame);
}
sizeBg(); for (let i = 0; i < 160; i++) parts.push(new Part());
window.addEventListener('resize', sizeBg);
if ('IntersectionObserver' in window) new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v && !visible) { visible = true; requestAnimationFrame(frame); } visible = v; }).observe(stage);
requestAnimationFrame(frame);

/* ---------- colours: the subway lines, plus the live mood ---------- */
const COLORS = [
  { k: 'mood', t: 'Mood' },
  { h: '#EE352E', l: '1', t: '1 2 3, red' }, { h: '#00933C', l: '4', t: '4 5 6, green' }, { h: '#B933AD', l: '7', t: '7, purple' },
  { h: '#0039A6', l: 'A', t: 'A C E, blue' }, { h: '#FF6319', l: 'B', t: 'B D F M, orange' }, { h: '#6CBE45', l: 'G', t: 'G, lime' },
  { h: '#996633', l: 'J', t: 'J Z, brown' }, { h: '#A7A9AC', l: 'L', t: 'L, grey' }, { h: '#FCCC0A', l: 'N', t: 'N Q R W, yellow' },
  { h: '#808183', l: 'S', t: 'S shuttle, dark grey' }, { h: '#F7B500', l: '', t: 'Taxi' }, { h: '#FFFFFF', l: '', t: 'White' }, { h: '#0D0D0D', l: '', t: 'Ink' }
];
const LIGHT = ['#FCCC0A', '#FFFFFF', '#F7B500', '#6CBE45', '#A7A9AC'];
let colorOverride = null;
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
const col = (a) => colorOverride ? hexA(colorOverride, a) : rgb(MOODS[mood].accent, a);

/* ---------- thirteen brushes, scaled to the painting ---------- */
let size = 1;
const S = () => K * size;
const BR = [
  { n: 'Thin', gap: 1.5, d(c, p) { c.fillStyle = col(.9); c.beginPath(); c.arc(p.x, p.y, 2 * S(), 0, 6.2832); c.fill(); } },
  { n: 'Thick', gap: 4, d(c, p) { c.fillStyle = col(.8); c.beginPath(); c.arc(p.x, p.y, 8 * S(), 0, 6.2832); c.fill(); } },
  { n: 'Spray', gap: 8, d(c, p) { c.fillStyle = col(.5); for (let i = 0; i < 15; i++) { c.beginPath(); c.arc(p.x + (Math.random() - .5) * 35 * S(), p.y + (Math.random() - .5) * 35 * S(), (1 + Math.random()) * S(), 0, 6.2832); c.fill(); } } },
  { n: 'Glow', gap: 6, d(c, p) { const r = 18 * S(), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, col(.6)); g.addColorStop(1, col(0)); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, 6.2832); c.fill(); } },
  { n: 'Square', gap: 5, d(c, p) { const s = 5 * S(); c.fillStyle = col(.8); c.fillRect(p.x - s, p.y - s, s * 2, s * 2); } },
  { n: 'Diamond', gap: 5, d(c, p) { const s = 5 * S(); c.fillStyle = col(.8); c.save(); c.translate(p.x, p.y); c.rotate(Math.PI / 4); c.fillRect(-s, -s, s * 2, s * 2); c.restore(); } },
  { n: 'Star', gap: 9, d(c, p) { const r = 7 * S(); c.fillStyle = col(.85); c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 4 * Math.PI / 5 - Math.PI / 2; c[i ? 'lineTo' : 'moveTo'](p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); } c.closePath(); c.fill(); } },
  { n: 'Ribbon', line: true, d(c, p, l) { c.strokeStyle = col(.7); c.lineWidth = 3 * S(); c.lineCap = 'round'; c.beginPath(); c.moveTo(l ? l.x : p.x, l ? l.y : p.y); c.lineTo(p.x, p.y); c.stroke(); } },
  { n: 'Splatter', gap: 10, d(c, p) { for (let i = 0; i < 8; i++) { const a = Math.random() * 6.2832, r = Math.random() * 25 * S(); c.fillStyle = col(.3 + Math.random() * .5); c.beginPath(); c.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, (1 + Math.random() * 4) * S(), 0, 6.2832); c.fill(); } } },
  { n: 'Dash', gap: 16, d(c, p) { const s = 6 * S(); c.strokeStyle = col(.8); c.lineWidth = 2 * S(); c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x + s, p.y); c.stroke(); } },
  { n: 'Fur', gap: 4, d(c, p) { c.strokeStyle = col(.4); c.lineWidth = .6 * S(); for (let i = 0; i < 6; i++) { const a = Math.random() * 6.2832, r = (5 + Math.random() * 12) * S(); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); c.stroke(); } } },
  { n: 'Pixel', gap: 4, d(c, p) { const g = Math.max(2, Math.round(6 * S())); c.fillStyle = col(.9); c.fillRect(Math.floor(p.x / g) * g, Math.floor(p.y / g) * g, g, g); } },
  { n: 'Calligraphy', gap: 1.5, d(c, p) { c.fillStyle = col(.85); c.save(); c.translate(p.x, p.y); c.rotate(-Math.PI / 6); c.beginPath(); c.ellipse(0, 0, 8 * S(), 2 * S(), 0, 0, 6.2832); c.fill(); c.restore(); } }
];
let brush = 0;

/* ---------- UI ---------- */
function chips(box, items, label, on) {
  items.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mkchip'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.innerHTML = label(it);
    b.addEventListener('click', () => { [].forEach.call(box.children, (x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); on(it, i); });
    box.appendChild(b);
  });
}
chips($('mkMoods'), Object.keys(MOODS), (k) => '<i style="background:' + rgb(MOODS[k].accent) + '"></i>' + MOODS[k].n, (k) => { mood = k; paintArt(); });
chips($('mkBrushes'), BR, (b) => b.n, (b, i) => { brush = i; });
COLORS.forEach((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mksw' + (c.k ? ' mood' : '');
  b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); b.title = c.t; b.setAttribute('aria-label', c.t);
  if (c.k) b.textContent = 'Mood'; else { b.style.background = c.h; b.textContent = c.l; if (LIGHT.indexOf(c.h) >= 0) b.style.color = '#0D0D0D'; }
  b.addEventListener('click', () => { colorOverride = c.h || null; [].forEach.call($('mkColors').children, (x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); });
  $('mkColors').appendChild(b);
});
$('mkSz').addEventListener('input', (e) => { size = +e.target.value; $('mkSzV').textContent = size + 'x'; });
$('mkWash').addEventListener('change', paintArt);

/* ---------- the handle: "MARKED UP BY @handle" on the strip, X rules (letters, digits, underscore, 15) ---------- */
const handleIn = $('mkHandle');
const cleanHandle = (v) => String(v || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 15);
function syncHandle() {
  const h = cleanHandle(handleIn.value);
  if (handleIn.value !== h) { const p = handleIn.selectionStart; handleIn.value = h; try { handleIn.setSelectionRange(p - 1, p - 1); } catch (e) {} }
  store.set('mk.handle', h);
  $('mkBy').textContent = h ? 'Marked up by @' + h : '';
  setX();
}
handleIn.value = cleanHandle(store.get('mk.handle'));
handleIn.addEventListener('input', syncHandle);

/* ---------- the painting layer ---------- */
function paintArt() {
  if (!img) return;
  ac.globalCompositeOperation = 'source-over'; ac.drawImage(img, 0, 0, W, H);
  if ($('mkWash').checked) { ac.globalCompositeOperation = 'soft-light'; ac.fillStyle = rgb(MOODS[mood].accent, .55); ac.fillRect(0, 0, W, H); ac.globalCompositeOperation = 'source-over'; }
}

/* ---------- drawing: pointer events, stamps spaced along the stroke so fast moves do not gap ---------- */
let down = false, last = null, undo = [];
function pos(e) { const r = ink.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
function stamp(p) {
  const b = BR[brush];
  if (b.line || !last) { b.d(ic, p, last); last = p; return; }
  const dx = p.x - last.x, dy = p.y - last.y, dist = Math.hypot(dx, dy), gap = Math.max(1, b.gap * S());
  if (dist < gap) return;
  const steps = Math.floor(dist / gap);
  for (let i = 1; i <= steps; i++) b.d(ic, { x: last.x + dx * i / steps, y: last.y + dy * i / steps });
  last = p;
}
function pushUndo() { try { undo.push(ic.getImageData(0, 0, W, H)); if (undo.length > 15) undo.shift(); } catch (e) {} }
ink.addEventListener('pointerdown', (e) => { if (!img) return; e.preventDefault(); try { ink.setPointerCapture(e.pointerId); } catch (x) {} pushUndo(); down = true; last = null; stamp(pos(e)); dirty = true; });
ink.addEventListener('pointermove', (e) => { if (!down) return; const ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; (ev.length ? ev : [e]).forEach((x) => stamp(pos(x))); });
const up = () => { down = false; last = null; };
ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up); ink.addEventListener('lostpointercapture', up);
function doUndo() { const s = undo.pop(); if (s) ic.putImageData(s, 0, 0); else ic.clearRect(0, 0, W, H); }
$('mkUndo').addEventListener('click', doUndo);
$('mkClear').addEventListener('click', () => { pushUndo(); ic.clearRect(0, 0, W, H); });
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); doUndo(); } });
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- loading a piece ---------- */
const msg = $('mkMsg');
let IDX = null, BYID = null;
function ready(cb) { if (window.MK_IDX) { if (!IDX) { IDX = window.MK_IDX; BYID = {}; IDX.forEach((r) => { BYID[r[0]] = r; BYID['n' + r[1]] = BYID['n' + r[1]] || r; }); } cb(); } else setTimeout(() => ready(cb), 60); }
function find(q) { q = String(q || '').trim().replace(/^#|^no\.?\s*/i, ''); return BYID[q] || BYID[q.toLowerCase()] || (/^\d+$/.test(q) ? BYID['n' + (+q)] : null); }
function setX() {
  if (!piece) return;
  $('mkX').href = 'https://x.com/intent/post?text=' + encodeURIComponent('I marked up NO. ' + piece[1] + ', ' + piece[2] + '. NEW YORKERS by MLow.') + '&url=' + encodeURIComponent(SITE + '/markup#n=' + piece[0]);
}
function load(row, push) {
  if (!row) { msg.textContent = 'No New Yorker by that number. Try another, or take a random one.'; return; }
  if (dirty && piece && piece[0] !== row[0] && !confirm('Load a new piece? Your marks on this one will be cleared. Save first if you want them.')) return;
  piece = row; msg.textContent = 'Loading NO. ' + row[1] + '.';
  const im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = () => {
    img = im; W = im.naturalWidth; H = im.naturalHeight; K = Math.max(W, H) / 900;
    art.width = ink.width = W; art.height = ink.height = H; undo = []; dirty = false;
    paintArt(); ic.clearRect(0, 0, W, H);
    $('mkNo').textContent = 'NO. ' + row[1]; $('mkT').textContent = row[2];
    $('mkN').value = row[1]; msg.textContent = '';
    $('mkRec').href = B + 'census.html#n=' + row[0];
    setX();
    const h = '#n=' + row[0]; if (location.hash !== h) history[push ? 'pushState' : 'replaceState'](null, '', h);
    sizeBg();
  };
  im.onerror = () => { msg.textContent = 'That painting would not load. Try another.'; };
  im.src = B + 'assets/t/' + row[3] + '.jpg';
}
const randomRow = () => IDX[Math.floor(Math.random() * IDX.length)];
$('mkFind').addEventListener('submit', (e) => { e.preventDefault(); ready(() => load(find($('mkN').value), true)); });
$('mkRand').addEventListener('click', () => ready(() => load(randomRow(), true)));
function fromHash() { const m = /[#&]n=([^&]+)/.exec(location.hash); ready(() => load(find(m ? decodeURIComponent(m[1]) : DEFAULT_ID) || find(DEFAULT_ID), false)); }
window.addEventListener('popstate', fromHash);

/* ---------- the strip: N3W YORKERS left, the piece and the handle in the middle, MLOW right ---------- */
const LOGO = {};
function logo(k) {
  if (LOGO[k]) return LOGO[k];
  LOGO[k] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = (window.MK_LOGOS || {})[k] || ''; });
  return LOGO[k];
}
logo('mlow'); logo('n3w');
function fit(x, t, max) { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '...').width > max) t = t.slice(0, -1); return t.replace(/[ ,]+$/, '') + '...'; }
const SERIF = 'Fraunces, Georgia, serif', MONO = '"IBM Plex Mono", Menlo, monospace';
function compose() {
  return Promise.all([logo('n3w'), logo('mlow')]).then(([n3w, mlow]) => {
    const u = W / 1000, strip = Math.round(124 * u), pad = Math.round(34 * u);
    const c = document.createElement('canvas'); c.width = W; c.height = H + strip;
    const x = c.getContext('2d');
    x.drawImage(art, 0, 0); x.drawImage(ink, 0, 0);
    x.fillStyle = '#0D0D0D'; x.fillRect(0, H, W, strip);
    x.fillStyle = '#1D222B'; x.fillRect(0, H, W, Math.max(1, Math.round(u)));
    const mid = H + strip / 2;
    let left = pad, right = W - pad;
    if (n3w) { const h = Math.round(58 * u), w = h * n3w.width / n3w.height; x.drawImage(n3w, left, mid - h / 2, w, h); left += w + Math.round(30 * u); }
    if (mlow) { const h = Math.round(30 * u), w = h * mlow.width / mlow.height; x.drawImage(mlow, right - w, mid - h / 2, w, h); right -= w + Math.round(30 * u); }
    x.fillStyle = '#2A3040'; x.fillRect(left - Math.round(15 * u), H + strip * .24, Math.max(1, Math.round(u)), strip * .52);
    const room = right - left, h = cleanHandle(handleIn.value);
    x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    const top = h ? mid - 6 * u : mid + 4 * u;
    x.fillStyle = '#D7FF1F'; x.font = '500 ' + Math.round(13 * u) + 'px ' + MONO;
    const no = 'NO. ' + piece[1]; x.fillText(no, left, top);
    const nx = left + x.measureText(no).width + 12 * u;
    x.fillStyle = '#F0F4F8'; x.font = '500 ' + Math.round(23 * u) + 'px ' + SERIF;
    x.fillText(fit(x, piece[2], room - (nx - left)), nx, top);
    x.font = '500 ' + Math.round(12 * u) + 'px ' + MONO;
    if (h) {
      x.fillStyle = '#8899AA'; const lbl = 'MARKED UP BY '; x.fillText(lbl, left, top + 26 * u);
      x.fillStyle = '#F0F4F8'; x.fillText(fit(x, '@' + h, room - x.measureText(lbl).width), left + x.measureText(lbl).width, top + 26 * u);
    } else {
      x.fillStyle = '#8899AA'; x.fillText(fit(x, 'MARKED UP AT N3WYORKERS.COM', room), left, top + 24 * u);
    }
    return new Promise((res) => c.toBlob(res, 'image/png'));
  });
}
function fontsReady() { return document.fonts && document.fonts.load ? Promise.all([document.fonts.load('500 20px Fraunces'), document.fonts.load('500 20px "IBM Plex Mono"')]).catch(() => {}) : Promise.resolve(); }
const slug = (t) => String(t).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
function fname() { const h = cleanHandle(handleIn.value); return 'NEW-YORKERS-' + piece[1] + '-' + slug(piece[2]) + '-marked-up' + (h ? '-by-' + h : '') + '.png'; }
const toast = (t) => { if (window.NY && window.NY.toast) window.NY.toast(t); else msg.textContent = t; };
$('mkSave').addEventListener('click', () => {
  if (!piece) return;
  fontsReady().then(compose).then((b) => {
    if (!b) { toast('This browser would not save the canvas. Try another browser.'); return; }
    const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000); dirty = false; toast('Saved ' + fname());
  });
});
const canFiles = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })); } catch (e) { return false; } })();
if (canFiles && matchMedia('(pointer: coarse)').matches) {
  $('mkShare').hidden = false;
  $('mkShare').addEventListener('click', () => {
    if (!piece) return;
    fontsReady().then(compose).then((b) => navigator.share({ files: [new File([b], fname(), { type: 'image/png' })], text: 'I marked up NO. ' + piece[1] + ', ' + piece[2] + '. NEW YORKERS by MLow. ' + SITE + '/markup#n=' + piece[0] }))
      .then(() => { dirty = false; }).catch((e) => { if (!e || e.name !== 'AbortError') toast('Sharing is not supported here. Use SAVE.'); });
  });
}

/* ---------- the room cards: the museum's sourced lines, each fronted by the New Yorker who hangs there ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let CARDS = [];
function buildCards() {
  const box = $('mkCards'); if (!box || !CARDS.length) return; box.innerHTML = '';
  shuffle(CARDS).slice(0, 6).forEach((c) => {
    const d = document.createElement('div'); d.className = 'mkcard';
    d.innerHTML = '<div class="mkin" tabindex="0" role="button" aria-label="' + esc(c.nm) + ', flip for the fact">' +
      '<div class="mkface"><img loading="lazy" alt="' + esc(c.pt) + '" src="' + B + 'assets/t/' + c.th + '.jpg"><div class="mkfm"><small>' + esc(c.a) + '</small><h3>' + esc(c.nm) + '</h3><span class="mkhint">Flip it</span></div></div>' +
      '<div class="mkface mkback"><div class="mky" style="color:' + esc(c.c) + '">' + esc(c.y) + '</div><p>' + esc(c.f) + '</p>' + (c.s ? '<div class="mksrc">Source: ' + esc(c.s) + '</div>' : '') +
      '<div class="mkgo"><button type="button" data-p="' + esc(c.p) + '">Mark up NO. ' + c.pn + '</button><a href="' + B + 'museum.html#room=' + esc(c.r) + '">Walk the room</a></div></div></div>';
    const inn = d.querySelector('.mkin');
    inn.addEventListener('click', (e) => { if (e.target.closest('a,button')) return; d.classList.toggle('flipped'); });
    inn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === inn) { e.preventDefault(); d.classList.toggle('flipped'); } });
    d.querySelector('button[data-p]').addEventListener('click', (e) => { e.stopPropagation(); ready(() => { load(find(c.p), true); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
    box.appendChild(d);
  });
}
if ($('mkShuffle')) $('mkShuffle').addEventListener('click', buildCards);
const cardSection = $('mkCards') && $('mkCards').closest('section');
function noCards() { if (cardSection) cardSection.hidden = true; }
fetch(B + 'assets/markup/cards.json').then((r) => r.ok ? r.json() : []).then((c) => { CARDS = c || []; if (CARDS.length) buildCards(); else noCards(); }).catch(noCards);

syncHandle();
fromHash();
})();
