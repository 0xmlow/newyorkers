/* The ticket MLOWTAR prints. One canvas, drawn from a seed, no two alike.
 *
 * Three systems share the art panel, the way MLow asked for them mixed:
 *   MEMORIES   the bloom grid, the identicon seal, the torn and perforated edges, the barcode and the seeded
 *              noise field are ports of MLow's Memories renderers (memories/site/renderers/core.js and
 *              helpers2.js), rewritten for Canvas 2D so the ticket can carry raster stickers and real fonts.
 *   GLYPHS     a one bit geometric glyph set in the Visualize Value idiom: a bagel, a slice, a manhole, a
 *              subway bullet, a water tower, a hydrant, a token, a MetroCard, the anthora cup, a pigeon, a
 *              stoop, a bridge, the nazar, a check. Circles, rectangles and arcs only. Black on paper.
 *   STICKERS   MLow's ChatGPT object stickers (the blue and white delft objects with the drips), chosen by
 *              the fortune's theme from assets/mlowtar/stickers.json and pressed on in one of five
 *              arrangements: hero, fan, scatter, column, bomb.
 *
 * renderTicket(res, {scale}) -> Promise<canvas>. res is the reading the booth already has (greet, reading,
 * omen, closer, card, room, lucky, theme, seed). Deterministic from res.seed. Never throws for a missing
 * image: a sticker that fails to load is skipped and the composition closes over the gap.
 * No date is printed anywhere (house rule: no dates burned into cards).
 */
import { hash, rng as RNG } from "./match.js";

const BASE = window.NY_BASE || "";
const THUMBS = window.MLOWTAR_THUMBS || (BASE + "assets/t/");
const W = 1000, H = 2720;
const PAPER = "#EEE6D3", CLOUD = "#ECE8DD", INK = "#141210", NIGHT = "#0F1A26", GOLD = "#ECC981", BRICK = "#A23231", CORAL = "#DC6F57", SKY = "#61C9E2", HARBOR = "#4692C2", AMBER = "#E79650", MIST = "#9CCCCF", SLATE = "#8FA7AB";
const EYE = "#2962FF", CYAN = "#00E5FF", NAVY = "#0b3aa6", DELFT = "#1d4ed8";   // MLow's blues (mlow-brand-assets)
const PALETTES = [
  { bg: PAPER, ink: INK, acc: EYE, acc2: GOLD, name: "paper" },
  { bg: PAPER, ink: INK, acc: HARBOR, acc2: SKY, name: "harbor" },
  { bg: "#F0F4F8", ink: NIGHT, acc: DELFT, acc2: CYAN, name: "cloud" },
  { bg: NIGHT, ink: CLOUD, acc: SKY, acc2: GOLD, name: "night" },
  { bg: PAPER, ink: NIGHT, acc: NAVY, acc2: MIST, name: "navy" },
  { bg: "#F3EADB", ink: INK, acc: DELFT, acc2: GOLD, name: "delft" },
];
const THEME_WORD = { love: "LOVE", money: "THE RENT", work: "THE JOB", home: "THE LEASE", move: "THE TRAIN", food: "THE ORDER", art: "THE WORK", luck: "THE ODDS", lost: "WHAT'S GONE", night: "AFTER HOURS", family: "THE FAMILY", fame: "THE SPOTLIGHT", city: "THE CITY", future: "WHAT'S NEXT", wander: "THE WALK" };

/* ---------- images ---------- */
const cache = new Map();
function img(url, ms) {
  if (cache.has(url)) return cache.get(url);
  const p = new Promise(res => { const i = new Image(); i.crossOrigin = "anonymous"; const t = setTimeout(() => res(null), ms || 6000);
    i.onload = () => { clearTimeout(t); res(i); }; i.onerror = () => { clearTimeout(t); res(null); }; i.src = url; });
  cache.set(url, p); return p;
}
let drawer = null;
const loadDrawer = () => drawer || (drawer = fetch(BASE + "assets/mlowtar/stickers.json").then(r => r.json()).catch(() => []));

/* ---------- seeded noise (port of helpers2 noise2d) ---------- */
function noise2d(seed) {
  const perm = new Uint8Array(512), r = RNG(seed >>> 0);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + (b - a) * t, grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  return (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return 0.5 + 0.5 * lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v) / 0.7; };
}

/* ---------- the glyph set (one bit, centred on x,y, size s) ---------- */
const G = {
  bagel(c, x, y, s) { c.beginPath(); c.arc(x, y, s * 0.46, 0, 7); c.arc(x, y, s * 0.17, 0, 7, true); c.fill(); },
  slice(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.48); c.lineTo(x - s * 0.36, y - s * 0.3); c.arc(x, y - s * 0.3, s * 0.36, Math.PI, 0); c.closePath(); c.fill();
    const p = c.fillStyle; c.fillStyle = G._paper; for (const [dx, dy] of [[-0.1, -0.2], [0.12, -0.1], [-0.02, 0.1]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, s * 0.06, 0, 7); c.fill(); } c.fillStyle = p; },
  manhole(c, x, y, s) { c.beginPath(); c.arc(x, y, s * 0.48, 0, 7); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { if (Math.hypot(i, j) > 2.3) continue; c.fillRect(x + i * s * 0.15 - s * 0.045, y + j * s * 0.15 - s * 0.045, s * 0.09, s * 0.09); } c.fillStyle = p; },
  bullet(c, x, y, s, t) { c.beginPath(); c.arc(x, y, s * 0.48, 0, 7); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper; c.font = `700 ${s * 0.6}px Helvetica, Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t || "N", x, y + s * 0.03); c.fillStyle = p; },
  tower(c, x, y, s) { c.fillRect(x - s * 0.3, y - s * 0.12, s * 0.6, s * 0.42); c.beginPath(); c.moveTo(x - s * 0.36, y - s * 0.12); c.lineTo(x, y - s * 0.46); c.lineTo(x + s * 0.36, y - s * 0.12); c.closePath(); c.fill();
    for (const dx of [-0.22, 0.22]) c.fillRect(x + dx * s - s * 0.03, y + s * 0.3, s * 0.06, s * 0.2); c.fillRect(x - s * 0.3, y + s * 0.02, s * 0.6, s * 0.03); },
  hydrant(c, x, y, s) { c.beginPath(); c.arc(x, y - s * 0.28, s * 0.17, Math.PI, 0); c.fill(); c.fillRect(x - s * 0.17, y - s * 0.28, s * 0.34, s * 0.6); c.fillRect(x - s * 0.36, y - s * 0.08, s * 0.72, s * 0.12); c.fillRect(x - s * 0.24, y + s * 0.32, s * 0.48, s * 0.1); c.beginPath(); c.arc(x, y - s * 0.44, s * 0.06, 0, 7); c.fill(); },
  token(c, x, y, s) { c.beginPath(); c.arc(x, y, s * 0.48, 0, 7); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper; c.beginPath(); c.moveTo(x, y + s * 0.02); c.lineTo(x - s * 0.2, y - s * 0.24); c.lineTo(x - s * 0.1, y - s * 0.24); c.lineTo(x, y - s * 0.1); c.lineTo(x + s * 0.1, y - s * 0.24); c.lineTo(x + s * 0.2, y - s * 0.24); c.closePath(); c.fill(); c.fillRect(x - s * 0.05, y - s * 0.02, s * 0.1, s * 0.26); c.fillStyle = p; },
  metrocard(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(-0.25); const w = s * 0.9, h = s * 0.56; rr(c, -w / 2, -h / 2, w, h, s * 0.05); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper; c.fillRect(-w / 2 + s * 0.06, -h / 2 + s * 0.1, w - s * 0.12, s * 0.07); c.fillRect(-w / 2 + s * 0.06, h / 2 - s * 0.16, w * 0.5, s * 0.05); c.fillStyle = p; c.restore(); },
  cup(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.34, y - s * 0.4); c.lineTo(x + s * 0.34, y - s * 0.4); c.lineTo(x + s * 0.24, y + s * 0.44); c.lineTo(x - s * 0.24, y + s * 0.44); c.closePath(); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper; c.fillRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.05); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x - s * 0.2 + i * s * 0.08, y, s * 0.028, 0, 7); c.fill(); } c.fillRect(x - s * 0.22, y + s * 0.18, s * 0.44, s * 0.04); c.fillStyle = p; },
  pigeon(c, x, y, s) { c.beginPath(); c.ellipse(x, y + s * 0.05, s * 0.36, s * 0.24, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 0.3, y - s * 0.16, s * 0.13, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + s * 0.42, y - s * 0.16); c.lineTo(x + s * 0.54, y - s * 0.12); c.lineTo(x + s * 0.42, y - s * 0.09); c.fill(); c.beginPath(); c.moveTo(x - s * 0.3, y); c.lineTo(x - s * 0.56, y - s * 0.12); c.lineTo(x - s * 0.34, y + s * 0.1); c.fill(); for (const dx of [-0.06, 0.08]) c.fillRect(x + dx * s, y + s * 0.26, s * 0.03, s * 0.14); },
  stoop(c, x, y, s) { for (let i = 0; i < 4; i++) c.fillRect(x - s * 0.44 + i * s * 0.11, y - s * 0.1 + i * s * 0.14, s * 0.88 - i * s * 0.22, s * 0.14); c.fillRect(x - s * 0.44, y - s * 0.46, s * 0.07, s * 0.5); c.fillRect(x + s * 0.37, y - s * 0.46, s * 0.07, s * 0.5); c.beginPath(); c.arc(x - s * 0.405, y - s * 0.46, s * 0.06, 0, 7); c.arc(x + s * 0.405, y - s * 0.46, s * 0.06, 0, 7); c.fill(); },
  bridge(c, x, y, s) { c.fillRect(x - s * 0.5, y + s * 0.1, s, s * 0.06); for (const dx of [-0.22, 0.22]) { c.fillRect(x + dx * s - s * 0.07, y - s * 0.46, s * 0.14, s * 0.56); } c.lineWidth = s * 0.035; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.1); c.quadraticCurveTo(x, y + s * 0.26, x + s * 0.5, y - s * 0.1); c.stroke(); for (let i = -4; i <= 4; i++) { const px = x + i * s * 0.1; c.beginPath(); c.moveTo(px, y + s * 0.1); c.lineTo(px, y - s * 0.1 + Math.pow(i / 5, 2) * -s * 0.0 + (1 - Math.pow(i / 5, 2)) * s * 0.28); c.stroke(); } },
  nazar(c, x, y, s) { c.beginPath(); c.arc(x, y, s * 0.48, 0, 7); c.fill(); const p = c.fillStyle; c.fillStyle = G._paper; c.beginPath(); c.arc(x, y, s * 0.33, 0, 7); c.fill(); c.fillStyle = p; c.beginPath(); c.arc(x, y, s * 0.2, 0, 7); c.fill(); c.fillStyle = G._paper; c.beginPath(); c.arc(x + s * 0.06, y - s * 0.06, s * 0.06, 0, 7); c.fill(); c.fillStyle = p; },
  check(c, x, y, s) { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? s * 0.5 : s * 0.42; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); const p = c.fillStyle; c.strokeStyle = G._paper; c.lineWidth = s * 0.09; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(x - s * 0.2, y); c.lineTo(x - s * 0.05, y + s * 0.16); c.lineTo(x + s * 0.22, y - s * 0.16); c.stroke(); c.fillStyle = p; },
  eyeflower(c, x, y, s) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.26, y + Math.sin(a) * s * 0.26, s * 0.2, s * 0.11, a, 0, 7); c.fill(); } G.nazar(c, x, y, s * 0.56); },
  star(c, x, y, s) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI * 2, r = i % 2 ? s * 0.2 : s * 0.5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); },
  heart(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.42); c.bezierCurveTo(x - s * 0.7, y - s * 0.05, x - s * 0.3, y - s * 0.55, x, y - s * 0.2); c.bezierCurveTo(x + s * 0.3, y - s * 0.55, x + s * 0.7, y - s * 0.05, x, y + s * 0.42); c.fill(); },
};
const GLYPH_BY_THEME = { love: ["heart", "bridge", "pigeon", "cup"], money: ["token", "check", "metrocard", "manhole"], work: ["cup", "tower", "metrocard", "bridge"], home: ["stoop", "tower", "hydrant", "bagel"], move: ["bullet", "metrocard", "token", "bridge"], food: ["bagel", "slice", "cup", "pigeon"], art: ["eyeflower", "star", "nazar", "check"], luck: ["star", "token", "check", "nazar"], lost: ["manhole", "pigeon", "nazar", "stoop"], night: ["tower", "bullet", "star", "cup"], family: ["stoop", "bagel", "heart", "pigeon"], fame: ["star", "check", "bullet", "eyeflower"], city: ["manhole", "hydrant", "tower", "bullet"], future: ["bridge", "tower", "eyeflower", "check"], wander: ["pigeon", "manhole", "hydrant", "slice"] };
const BULLETS = ["1", "4", "7", "A", "B", "G", "J", "L", "N"];
/* every font set through here so tracking is deliberate: labels open, the display face tight */
function setFont(c, font, spacing) { c.font = font; try { c.letterSpacing = spacing || "0px"; c.fontKerning = "normal"; } catch (e) {} }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* bloom, the house generative mark from Memories (core.js), on canvas */
function bloom(c, r, x, y, size, ink, acc) {
  const n = 3 + Math.floor(r() * 3), cell = size / n, ax = Math.floor(r() * n), ay = Math.floor(r() * n);
  for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < Math.ceil(n / 2); gx++) {
    if (r() < 0.38) continue; const t = Math.floor(r() * 5); c.fillStyle = (gx === ax && gy === ay) ? acc : ink;
    const draw = cx => { const px = x + cx * cell, py = y + gy * cell, h = cell / 2;
      if (t === 0) { c.beginPath(); c.arc(px + h, py + h, h * 0.72, 0, 7); c.fill(); }
      else if (t === 1) { c.lineWidth = Math.max(2, cell * 0.13); c.strokeStyle = c.fillStyle; c.beginPath(); c.arc(px + h, py + h, h * 0.68, 0, 7); c.stroke(); }
      else if (t === 2) { c.beginPath(); c.moveTo(px, py + cell); c.arc(px, py + cell, cell, -Math.PI / 2, 0); c.lineTo(px + cell, py + cell); c.closePath(); c.fill(); }
      else if (t === 3) c.fillRect(px + cell * 0.14, py + cell * 0.14, cell * 0.72, cell * 0.72);
      else { c.beginPath(); c.moveTo(px + h, py); c.quadraticCurveTo(px + h * 1.16, py + h * 0.84, px + cell, py + h); c.quadraticCurveTo(px + h * 1.16, py + h * 1.16, px + h, py + cell); c.quadraticCurveTo(px + h * 0.84, py + h * 1.16, px, py + h); c.quadraticCurveTo(px + h * 0.84, py + h * 0.84, px + h, py); c.fill(); } };
    draw(gx); draw(n - 1 - gx);
  }
}
function identicon(c, key, x, y, size, n, ink, acc) {
  const r = RNG(hash(key)), cell = size / n, ai = Math.floor(r() * n * n);
  for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < Math.ceil(n / 2); gx++) { if (r() <= 0.5) continue; c.fillStyle = gy * n + gx === ai ? acc : ink;
    c.fillRect(x + gx * cell, y + gy * cell, cell + 0.5, cell + 0.5); if (gx !== n - 1 - gx) c.fillRect(x + (n - 1 - gx) * cell, y + gy * cell, cell + 0.5, cell + 0.5); }
}
function barcode(c, r, x, y, w, h, fill) { c.fillStyle = fill; let cx = x; while (cx < x + w) { const bw = 2 + Math.floor(r() * 6); if (r() > 0.4) c.fillRect(cx, y, bw, h); cx += bw + 2; } }
function perfRow(c, x, y, n, gap, rad, fill) { c.fillStyle = fill; for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x + i * gap, y, rad, 0, 7); c.fill(); } }
function tornEdge(c, r, y, amp, up, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(0, up ? 0 : H); c.lineTo(0, y); for (let i = 1; i <= 40; i++) c.lineTo(W * i / 40, y + (r() - 0.5) * 2 * amp); c.lineTo(W, up ? 0 : H); c.closePath(); c.fill(); }
function wrapText(c, text, x, y, maxW, lh, maxLines) { const words = String(text || "").split(/\s+/); let line = "", lines = []; for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"; } lines.forEach((l, i) => c.fillText(l, x, y + i * lh)); return y + lines.length * lh; }

/* a sticker reduced to two tones with an ordered dither, the way MLow's dither packs do it */
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function dithered(im, size, inkHex) {
  const ar = im.width / im.height, w = Math.round(ar >= 1 ? size : size * ar), h = Math.round(ar >= 1 ? size / ar : size);
  const o = document.createElement("canvas"); o.width = w; o.height = h; const x = o.getContext("2d"); x.drawImage(im, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), px = d.data, ink = [parseInt(inkHex.slice(1, 3), 16), parseInt(inkHex.slice(3, 5), 16), parseInt(inkHex.slice(5, 7), 16)];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const i = (yy * w + xx) * 4; if (px[i + 3] < 40) { px[i + 3] = 0; continue; }
    const l = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255, th = (BAYER[yy & 3][xx & 3] + 0.5) / 16;
    if (l < th) { px[i] = ink[0]; px[i + 1] = ink[1]; px[i + 2] = ink[2]; px[i + 3] = 255; } else px[i + 3] = 0; }
  x.putImageData(d, 0, 0); return o;
}
function stampCoin(c, im, x, y, size, rot, ring, bg) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = ring; c.beginPath(); c.arc(0, 0, size / 2, 0, 7); c.fill();
  c.fillStyle = bg; c.beginPath(); c.arc(0, 0, size / 2 - size * 0.06, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, size / 2 - size * 0.08, 0, 7); c.clip();
  const ar = im.width / im.height, w = ar >= 1 ? size * 0.8 : size * 0.8 * ar, h = ar >= 1 ? size * 0.8 / ar : size * 0.8; c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
}
/* the glitch: a frame of the ticket moshed, the STILL WAITING treatment. t in seconds, deterministic per (seed, frame) */
export function glitchFrame(src, dst, t, seed) {
  const W2 = dst.width, H2 = dst.height, c = dst.getContext("2d"), r = RNG((seed >>> 0) ^ Math.floor(t * 24)), burst = (Math.sin(t * 2.1) + Math.sin(t * 5.3 + 1)) > 1.2 ? 1 : 0.18;
  c.globalCompositeOperation = "source-over"; c.drawImage(src, 0, 0, W2, H2);
  const n = 3 + Math.floor(r() * 9 * burst);
  for (let i = 0; i < n; i++) { const y = Math.floor(r() * H2), h = 4 + Math.floor(r() * 46 * burst), dx = Math.round((r() - 0.5) * 60 * burst); c.drawImage(src, 0, y * src.height / H2, src.width, h * src.height / H2, dx, y, W2, h); }
  if (burst > 0.5 || r() < 0.3) {
    c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35;
    c.filter = "url(#none)"; c.filter = "none";
    const o = Math.round(6 * burst); c.drawImage(src, -o, 0, W2, H2); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    const d = c.getImageData(0, 0, W2, Math.min(H2, 220)); const px = d.data; for (let i = 0; i < px.length; i += 4) { px[i] = Math.min(255, px[i] + 18); px[i + 2] = Math.max(0, px[i + 2] - 10); } c.putImageData(d, 0, 0);
  }
  c.globalAlpha = 0.12; c.fillStyle = "#000"; for (let y = (Math.floor(t * 60) % 4); y < H2; y += 4) c.fillRect(0, y, W2, 1); c.globalAlpha = 1;
  if (r() < 0.12 * burst) { const bw = 40 + r() * 200, bh = 20 + r() * 80, bx = r() * (W2 - bw), by = r() * (H2 - bh); c.drawImage(dst, bx, by, bw, bh, bx + (r() - 0.5) * 120, by, bw, bh); }
}
export function recordLoop(src, seconds, seed, fps) {
  return new Promise((resolve, reject) => {
    const dst = document.createElement("canvas"); dst.width = Math.round(src.width / 2); dst.height = Math.round(src.height / 2);
    const stream = dst.captureStream(fps || 30), type = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) return reject(new Error("no recorder"));
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 }), chunks = []; rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => resolve(new Blob(chunks, { type })); rec.onerror = reject;
    const t0 = performance.now(); rec.start(200);
    (function tick() { const t = (performance.now() - t0) / 1000; glitchFrame(src, dst, t, seed); if (t < (seconds || 3)) requestAnimationFrame(tick); else rec.stop(); })();
  });
}
/* ---------- stickers ---------- */
async function pickStickers(r, theme, n) {
  const all = await loadDrawer(); if (!all || !all.length) return [];
  const want = all.filter(s => s[3].includes(theme)), any = all.filter(s => s[3].includes("any")), brand = all.filter(s => s[3].includes("brand"));
  const pool = (want.length >= 6 ? want : want.concat(any)).slice(); const out = [];
  while (out.length < n && pool.length) { const i = Math.floor(r() * pool.length); out.push(pool.splice(i, 1)[0]); }
  if (r() < 0.6 && brand.length) out.push(brand[Math.floor(r() * brand.length)]);
  const imgs = await Promise.all(out.map(s => img(BASE + "assets/mlowtar/stickers/" + s[0] + ".png")));
  return out.map((s, i) => ({ meta: s, im: imgs[i] })).filter(s => s.im);
}
function stamp(c, im, x, y, size, rot, shadow) {
  const ar = im.width / im.height, w = ar >= 1 ? size : size * ar, h = ar >= 1 ? size / ar : size;
  c.save(); c.translate(x, y); c.rotate(rot); if (shadow) { c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = size * 0.08; c.shadowOffsetY = size * 0.03; }
  c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
}

/* ---------- the art panel ---------- */
async function artPanel(c, r, res, P, x0, y0, S) {
  const theme = res.theme || "wander"; G._paper = P.bg;
  c.save(); c.beginPath(); c.rect(x0, y0, S, S); c.clip();
  c.fillStyle = P.bg; c.fillRect(x0, y0, S, S);
  // ground
  const ground = Math.floor(r() * 5);
  if (ground === 0) {            // contour field from seeded noise
    const nz = noise2d(res.seed), sc = 2.2 + r() * 2; c.strokeStyle = P.ink; c.globalAlpha = 0.14; c.lineWidth = 1.4;
    for (let lv = 0.3; lv < 0.95; lv += 0.08) for (let gy = 0; gy < 60; gy++) { let on = false; c.beginPath(); for (let gx = 0; gx <= 60; gx++) { const v = nz(gx / 60 * sc, gy / 60 * sc + res.seed % 7); const px = x0 + gx / 60 * S, py = y0 + gy / 60 * S; if (Math.abs(v - lv) < 0.025) { if (!on) { c.moveTo(px, py); on = true; } else c.lineTo(px, py); } else on = false; } c.stroke(); }
    c.globalAlpha = 1;
  } else if (ground === 1) {     // halftone gradient
    c.fillStyle = P.ink; c.globalAlpha = 0.35; const d = 24, ang = r() * Math.PI; for (let gy = 0; gy < S / d + 2; gy++) for (let gx = 0; gx < S / d + 2; gx++) { const px = x0 + gx * d + (gy % 2) * d / 2, py = y0 + gy * d; const t = ((px - x0) * Math.cos(ang) + (py - y0) * Math.sin(ang)) / S; const rad = Math.max(0, (0.5 - Math.abs(t - 0.5)) * d * 0.7 - 2); if (rad > 0.6) { c.beginPath(); c.arc(px, py, rad, 0, 7); c.fill(); } }
    c.globalAlpha = 1;
  } else if (ground === 2) {     // hatch
    c.strokeStyle = P.ink; c.globalAlpha = 0.1; c.lineWidth = 2; const gap = 18 + r() * 10; for (let k = -S; k < S * 2; k += gap) { c.beginPath(); c.moveTo(x0 + k, y0); c.lineTo(x0 + k - S, y0 + S); c.stroke(); } c.globalAlpha = 1;
  } else if (ground === 3) {     // bloom tiles, the Memories mark repeated
    const n = 3 + Math.floor(r() * 2), cell = S / n; for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) { c.globalAlpha = 0.1 + r() * 0.08; bloom(c, r, x0 + gx * cell + cell * 0.14, y0 + gy * cell + cell * 0.14, cell * 0.72, P.ink, P.acc); } c.globalAlpha = 1;
  } else {                       // a solid field of the accent with a paper window
    c.fillStyle = P.acc; c.fillRect(x0, y0, S, S); c.fillStyle = P.bg; const m = S * (0.06 + r() * 0.08); if (r() < 0.5) { c.beginPath(); c.arc(x0 + S / 2, y0 + S / 2, S / 2 - m, 0, 7); c.fill(); } else rr(c, x0 + m, y0 + m, S - 2 * m, S - 2 * m, S * 0.04), c.fill();
  }
  // glyph layer
  const glyphs = GLYPH_BY_THEME[theme] || GLYPH_BY_THEME.wander, mode = Math.floor(r() * 4);
  c.fillStyle = P.ink;
  if (mode === 0) {              // one giant glyph, Butcher scale
    const g = glyphs[Math.floor(r() * glyphs.length)]; c.fillStyle = P.ink; G[g](c, x0 + S / 2, y0 + S / 2, S * 0.62, res.lucky && res.lucky.train);
  } else if (mode === 1) {       // grid of glyphs
    const n = 3, m = S * 0.12, cell = (S - 2 * m) / n; for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) { const g = glyphs[(gx + gy * n + Math.floor(r() * 2)) % glyphs.length]; c.fillStyle = (gx + gy) % 2 && r() < 0.5 ? P.acc : P.ink; G[g](c, x0 + m + gx * cell + cell / 2, y0 + m + gy * cell + cell / 2, cell * 0.5, BULLETS[(gx + gy) % 9]); }
  } else if (mode === 2) {       // a ring of glyphs round a seal
    const n = 8 + Math.floor(r() * 3), R = S * 0.32; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2, g = glyphs[i % glyphs.length]; c.fillStyle = i === 0 ? P.acc : P.ink; G[g](c, x0 + S / 2 + Math.cos(a) * R, y0 + S / 2 + Math.sin(a) * R, S * 0.11, BULLETS[i % 9]); }
    c.fillStyle = P.acc; c.beginPath(); c.arc(x0 + S / 2, y0 + S / 2, S * 0.14, 0, 7); c.fill(); c.fillStyle = P.bg; G.bullet(c, x0 + S / 2, y0 + S / 2, S * 0.2, res.lucky && res.lucky.train); c.fillStyle = P.ink;
  } else {                       // mode 3: a scatter of small glyphs, a field for the stickers
    for (let i = 0; i < 8; i++) { const g = glyphs[i % glyphs.length]; c.globalAlpha = 0.14 + r() * 0.2; c.fillStyle = r() < 0.3 ? P.acc : P.ink; G[g](c, x0 + S * (0.14 + r() * 0.72), y0 + S * (0.14 + r() * 0.72), S * (0.06 + r() * 0.06), BULLETS[i % 9]); } c.globalAlpha = 1; c.fillStyle = P.ink;
  }
  // stickers: always on the ticket, in one of eight arrangements; three of them fold the stickers into the system
  const arrangement = ["hero", "fan", "scatter", "column", "bomb", "grid", "coin", "dither"][Math.floor(r() * 8)];
  const count = arrangement === "hero" ? 1 : arrangement === "bomb" ? 5 : arrangement === "grid" ? 5 : arrangement === "coin" ? 4 : arrangement === "dither" ? 3 : 2 + Math.floor(r() * 2);
  const spot = () => { let px, py; do { px = 0.2 + r() * 0.6; py = 0.2 + r() * 0.6; } while ((px > 0.68 && py < 0.32) || (px < 0.32 && py > 0.68)); return [px, py]; };   // off the seal and the tag
  const st = await pickStickers(r, theme, count);
  if (st.length) {
    if (arrangement === "grid") {         // glyph, sticker, glyph: a 3 by 3 of both systems
      c.fillStyle = P.bg; c.fillRect(x0, y0, S, S); const cell = S / 3; let si = 0;
      for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) { const cx = x0 + gx * cell + cell / 2, cy = y0 + gy * cell + cell / 2;
        if ((gx + gy) % 2 === 0 && si < st.length) stamp(c, st[si++].im, cx, cy, cell * 0.8, (r() - 0.5) * 0.3, true);
        else { c.fillStyle = (gx + gy) % 3 === 1 ? P.acc : P.ink; G[glyphs[(gx + gy * 3) % glyphs.length]](c, cx, cy, cell * 0.56, BULLETS[(gx + gy) % 9]); } }
      c.strokeStyle = P.ink; c.lineWidth = 2; for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(x0 + k * cell, y0); c.lineTo(x0 + k * cell, y0 + S); c.moveTo(x0, y0 + k * cell); c.lineTo(x0 + S, y0 + k * cell); c.stroke(); }
    } else if (arrangement === "coin") {  // stickers struck as tokens, in a gold ring
      st.forEach((s, i) => { const a = i / st.length * Math.PI * 2 - Math.PI / 4; stampCoin(c, s.im, x0 + S / 2 + Math.cos(a) * S * 0.25, y0 + S / 2 + Math.sin(a) * S * 0.25, S * 0.26, (r() - 0.5) * 0.4, P.acc2, P.bg); });
      c.fillStyle = P.acc; G[glyphs[0]](c, x0 + S / 2, y0 + S / 2, S * 0.16, res.lucky && res.lucky.train);
    } else if (arrangement === "dither") { // the stickers in two tones, the dither pack look, one in colour
      st.forEach((s, i) => { const big = i === 0; const im = big ? s.im : dithered(s.im, S * 0.3, P.acc); const [px, py] = big ? [0.5, 0.5] : spot(); stamp(c, im, x0 + S * px, y0 + S * py, big ? S * 0.46 : S * 0.3, (r() - 0.5) * 0.5, big); });
    } else if (arrangement === "hero") stamp(c, st[0].im, x0 + S / 2, y0 + S / 2, S * 0.64, (r() - 0.5) * 0.16, true);
    else if (arrangement === "fan") st.forEach((s, i) => { const a = (i - (st.length - 1) / 2) * 0.3; stamp(c, s.im, x0 + S / 2 + Math.sin(a) * S * 0.26, y0 + S * 0.58 - Math.cos(a) * S * 0.06, S * 0.32, a, true); });
    else if (arrangement === "scatter") st.forEach(s => { const [px, py] = spot(); stamp(c, s.im, x0 + S * px, y0 + S * py, S * (0.22 + r() * 0.1), (r() - 0.5) * 0.7, true); });
    else if (arrangement === "column") st.forEach((s, i) => stamp(c, s.im, x0 + S * (0.34 + (i % 2) * 0.32), y0 + S * (0.24 + i / Math.max(1, st.length - 1) * 0.52), S * 0.26, (r() - 0.5) * 0.3, true));
    else st.forEach((s, i) => { const a = i / st.length * Math.PI * 2 + r(); stamp(c, s.im, x0 + S / 2 + Math.cos(a) * S * 0.17, y0 + S / 2 + Math.sin(a) * S * 0.17, S * (0.26 + r() * 0.08), (r() - 0.5) * 1.0, true); });
  }
  // the seal: an identicon of the question, the Memories way of making a token somebody's
  const seal = S * 0.11; c.fillStyle = P.bg; c.beginPath(); c.arc(x0 + S - seal * 0.9, y0 + seal * 0.9, seal * 0.78, 0, 7); c.fill();
  identicon(c, (res.question || "") + "|" + res.seed, x0 + S - seal * 1.35, y0 + seal * 0.45, seal * 0.9, 5, P.ink, P.acc);
  // the theme tag
  const tag = THEME_WORD[theme] || THEME_WORD.wander; setFont(c, "700 22px 'IBM Plex Mono', monospace", "3px"); const tw = c.measureText(tag).width + 44;
  c.fillStyle = P.acc2; rr(c, x0 + 22, y0 + S - 68, tw, 46, 6); c.fill(); c.fillStyle = INK; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(tag, x0 + 44, y0 + S - 45); setFont(c, c.font);
  c.restore();
  // frame
  c.strokeStyle = P.name === "night" ? GOLD : INK; c.lineWidth = 3; c.strokeRect(x0 + 1.5, y0 + 1.5, S - 3, S - 3);
}

/* ---------- the ticket: the site's transit kit on paper ---------- */
let logosIdx = null;
const loadLogos = () => logosIdx || (logosIdx = fetch(BASE + "assets/brand/logos/logos.json").then(r => r.json()).then(j => (j.logos || []).filter(l => l.use && !l.dark)).catch(() => []));
function platformEdge(c, x, y, w, h) {              // the tactile edge under the station sign (site.css --platform)
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#E4BC66"); g.addColorStop(1, "#D1A24E"); c.fillStyle = g; c.fillRect(x, y, w, h);
  for (let px = x + 6; px < x + w; px += 12) { c.fillStyle = "#B98A3A"; c.beginPath(); c.arc(px, y + h / 2, 3.2, 0, 7); c.fill(); c.fillStyle = "#F8E3A8"; c.beginPath(); c.arc(px, y + h / 2, 1.6, 0, 7); c.fill(); }
}
function awning(c, x, y, w, h) {                    // the bodega awning stripe
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = PAPER; c.fillRect(x, y, w, h); c.fillStyle = EYE;
  for (let k = -h; k < w + h; k += 44) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k + 22, y); c.lineTo(x + k + 22 - h * 0.35, y + h); c.lineTo(x + k - h * 0.35, y + h); c.closePath(); c.fill(); }
  c.restore(); c.fillStyle = NAVY; for (let k = 0; k < w; k += 44) { c.beginPath(); c.arc(x + k + 22, y + h, 10, 0, Math.PI); c.fill(); }
}
function drawQR(c, text, x, y, size, dark, light) {
  try { const q = window.qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), cell = size / (n + 4);
    c.fillStyle = light; c.fillRect(x, y, size, size); c.fillStyle = dark;
    for (let rr_ = 0; rr_ < n; rr_++) for (let cc = 0; cc < n; cc++) if (q.isDark(rr_, cc)) c.fillRect(x + (cc + 2) * cell, y + (rr_ + 2) * cell, cell + 0.4, cell + 0.4);
    return true; } catch (e) { return false; }
}
function metroCard(c, x, y, w, h, res, ink) {        // the lucky strip as a MetroCard
  c.save(); c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = 18; c.shadowOffsetY = 8; c.fillStyle = GOLD; rr(c, x, y, w, h, 14); c.fill(); c.restore();
  c.save(); rr(c, x, y, w, h, 14); c.clip();
  c.fillStyle = HARBOR; c.fillRect(x, y + h - 34, w, 34); c.fillStyle = "#1b1b1b"; c.fillRect(x, y + h - 42, w, 6);
  c.fillStyle = "#ECE8DD"; c.font = "700 16px 'IBM Plex Mono', monospace"; c.textAlign = "right"; c.fillText("N3W YORKERS  ·  GOOD FOR ONE FORTUNE", x + w - 18, y + h - 12);
  c.restore();
  c.textAlign = "left"; c.textBaseline = "alphabetic";
  c.fillStyle = INK; setFont(c, "900 32px 'Space Grotesk', Helvetica, sans-serif", "-0.5px"); c.fillText("N3W YORKERS", x + 26, y + 46);
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(x + 54, y + 92, 26, 0, 7); c.fill(); c.fillStyle = GOLD; c.font = "700 28px Helvetica, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(res.lucky ? res.lucky.train : "N", x + 54, y + 93);
  c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = "#5a4a20"; setFont(c, "700 13px 'IBM Plex Mono', monospace", "2px"); c.fillText("LUCKY TRAIN", x + 96, y + 84); c.fillText("LUCKY NUMBER", x + 290, y + 84);
  c.fillStyle = INK; setFont(c, "700 28px 'Space Grotesk', sans-serif"); c.fillText("the " + (res.lucky ? res.lucky.train : "N"), x + 96, y + 112); c.fillText("No. " + (res.lucky ? res.lucky.number : ""), x + 290, y + 112);
  const link = "https://n3wyorkers.com/mlowtar#q=" + encodeURIComponent((res.question || "").slice(0, 80)) + "&s=" + (res.seed >>> 0);
  if (!drawQR(c, link, x + w - 136, y + 12, 112, "#1b1b1b", GOLD)) barcode(c, RNG(res.seed >>> 0), x + w - 290, y + 24, 262, 70, "#1b1b1b");
  c.fillStyle = "#5a4a20"; setFont(c, "500 12px 'IBM Plex Mono', monospace", "1px"); c.textAlign = "right"; c.fillText("SCAN TO REPLAY", x + w - 150, y + 60); c.fillText(res.serial ? "TICKET " + String(res.serial).padStart(4, "0") : ("N3W-" + (res.seed >>> 0).toString(36).toUpperCase()).slice(0, 12), x + w - 150, y + 82); c.textAlign = "left"; setFont(c, c.font);
}
export async function renderTicket(res, opts) {
  opts = opts || {}; const scale = opts.scale || 1, seed = res.seed >>> 0, r = RNG(seed ^ 0x5bd1e995);
  try { await Promise.all([document.fonts.load("900 90px Fraunces"), document.fonts.load("500 30px Fraunces"), document.fonts.load("italic 500 30px Fraunces"), document.fonts.load("700 26px 'IBM Plex Mono'"), document.fonts.load("700 26px 'Space Grotesk'")]); } catch (e) {}
  const P = PALETTES[Math.floor(RNG(seed ^ 0xa5a5a5)() * PALETTES.length)];
  const [logos, frieze, mlowLogo, paperTex] = await Promise.all([loadLogos(), img(BASE + "assets/ui/mosaic-eye.webp", 4000), img(BASE + "assets/mlowtar/brand/logo_white.png", 4000), img(BASE + "assets/mlowtar/paper.jpg", 5000)]);
  const logo = logos && logos.length ? await img(BASE + logos[Math.floor(RNG(seed ^ 0x77)() * logos.length)].file, 5000) : null;
  const cv = document.createElement("canvas"); cv.width = W * scale; cv.height = H * scale; const c = cv.getContext("2d"); c.scale(scale, scale);
  const dark = P.name === "night", ink = dark ? CLOUD : INK, dim = dark ? SLATE : "#6a6050", paper = dark ? NIGHT : PAPER;
  c.fillStyle = paper; c.fillRect(0, 0, W, H);
  c.globalAlpha = dark ? 0.08 : 0.05; c.fillStyle = ink; for (let i = 0; i < 2600; i++) c.fillRect(r() * W, r() * H, 1.5, 1.5); c.globalAlpha = 1;
  // tear strips
  tornEdge(c, r, 26, 9, true, "#080D16"); tornEdge(c, r, H - 30, 9, false, "#080D16");
  perfRow(c, 50, 70, 24, 39, 7, "#080D16"); perfRow(c, 50, H - 76, 24, 39, 7, "#080D16");
  // the station sign: black enamel, a thin white rule, the name in the display face
  c.fillStyle = "#0b0c0f"; c.fillRect(0, 96, W, 150); c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(0, 108, W, 2); c.fillRect(0, 234, W, 2);
  // the enamel band: the artist's mark IS the word, then SPEAKS, the pair centred; the lucky bullet at the right
  setFont(c, "900 66px Fraunces, Georgia, serif", "-1px"); c.textAlign = "left"; c.textBaseline = "middle";
  const sw = c.measureText("SPEAKS").width, lh = 56, lw = mlowLogo ? lh * mlowLogo.width / mlowLogo.height : 0, gap = 22, total = lw + (lw ? gap : 0) + sw, x0h = (W - total) / 2;
  if (mlowLogo) c.drawImage(mlowLogo, x0h, 171 - lh / 2, lw, lh);
  c.fillStyle = CLOUD; c.fillText("SPEAKS", x0h + lw + (lw ? gap : 0), 173);
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(W - 86, 171, 24, 0, 7); c.fill();
  c.fillStyle = { "1": CORAL, "4": SKY, "7": BRICK, "A": HARBOR, "B": AMBER, "G": MIST, "J": "#A54F2A", "L": SLATE, "N": GOLD }[res.lucky ? res.lucky.train : "N"] || GOLD; c.beginPath(); c.arc(W - 86, 171, 20, 0, 7); c.fill();
  c.fillStyle = "#0b0c0f"; setFont(c, "700 24px Helvetica, Arial, sans-serif"); c.textAlign = "center"; c.fillText(res.lucky ? res.lucky.train : "N", W - 86, 172);
  platformEdge(c, 0, 246, W, 18);
  c.textAlign = "center"; c.fillStyle = dim; setFont(c, "500 16px 'IBM Plex Mono', monospace", "3px");
  c.fillText("A FORTUNE FROM THE CENSUS  ·  " + (res.serial ? "TICKET " + String(res.serial).padStart(4, "0") + (res.of ? " OF " + res.of.toLocaleString("en-US") : "") : "UNNUMBERED PRINT  ·  " + seed.toString(16).toUpperCase()), W / 2, 284); setFont(c, c.font);
  // art
  const AS = 780, AX = (W - AS) / 2, AY = 300; await artPanel(c, r, res, P, AX, AY, AS);
  // the mosaic eye frieze
  if (frieze) { const fh = 44, fw = frieze.width / frieze.height * fh, fy0 = AY + AS + 16; c.save(); c.beginPath(); c.rect(80, fy0, W - 160, fh); c.clip(); for (let fx = 80; fx < W - 80; fx += fw) c.drawImage(frieze, fx, fy0, fw, fh); c.restore(); }
  // the reading
  let y = AY + AS + 112; c.textAlign = "left"; c.textBaseline = "alphabetic";
  if (res.question) { c.fillStyle = dim; c.font = "italic 500 30px Fraunces, Georgia, serif"; y = wrapText(c, "“" + res.question + "”", 80, y, W - 160, 38, 2) + 14; }
  c.fillStyle = dim; setFont(c, "700 16px 'IBM Plex Mono', monospace", "3px"); c.fillText("YOUR NEW YORKER", 80, y + 8); setFont(c, c.font);
  if (res.card) {
    const th = await img(THUMBS + res.card.thumb + ".jpg", 5000);
    if (th) {                      // the whole painting at its own aspect, never cropped to a square
      const ar = th.width / th.height, bw = W - 160, maxH = 400; let w = bw, h = w / ar; if (h > maxH) { h = maxH; w = h * ar; }
      const ix = 80 + (bw - w) / 2; c.save(); c.shadowColor = "rgba(0,0,0,.22)"; c.shadowBlur = 16; c.shadowOffsetY = 6; rr(c, ix, y + 24, w, h, 8); c.fillStyle = "#000"; c.fill(); c.restore();
      c.save(); rr(c, ix, y + 24, w, h, 8); c.clip(); c.drawImage(th, ix, y + 24, w, h); c.restore(); y += h + 44;
    } else y += 24;
    c.fillStyle = dark ? GOLD : EYE; setFont(c, "700 50px Fraunces, Georgia, serif", "-1px"); c.fillText("No. " + res.card.id, 80, y + 36);
    c.fillStyle = ink; setFont(c, "500 34px Fraunces, Georgia, serif"); const ny = wrapText(c, res.card.title, 80, y + 86, W - 160, 40, 2);
    c.fillStyle = dim; setFont(c, "500 20px 'Space Grotesk', sans-serif"); c.fillText([res.card.family, res.card.neighborhood || res.card.borough].filter(Boolean).join("  ·  "), 80, ny + 10);
    y = ny + 50;
  } else y += 40;
  c.fillStyle = dark ? SKY : EYE; setFont(c, "500 38px Fraunces, Georgia, serif");
  const oy = wrapText(c, res.omen, 80, y + 44, W - 160, 48, 4); y = oy + 18;
  c.fillStyle = dim; setFont(c, "700 16px 'IBM Plex Mono', monospace", "3px"); c.fillText("THE ROOM FOR YOU", 80, y + 8);
  c.fillStyle = ink; setFont(c, "500 40px Fraunces, Georgia, serif", "-0.5px"); c.fillText(res.room ? res.room.name : "The museum", 80, y + 56);
  c.fillStyle = dim; setFont(c, "500 16px 'IBM Plex Mono', monospace", "2px"); c.fillText((res.room && res.room.area || "").toUpperCase(), 80, y + 88); setFont(c, c.font);
  // the MetroCard
  const ly = Math.min(y + 128, H - 470); metroCard(c, 80, ly, W - 160, 150, res, ink);
  // the footer: a lockup from the brand set, the address, the closer, the awning
  const fy = Math.max(ly + 176, H - 300);
  if (logo) { c.save(); if (dark) { c.fillStyle = PAPER; rr(c, 80, fy - 6, 118, 118, 10); c.fill(); } c.globalCompositeOperation = "multiply"; c.drawImage(logo, 84, fy - 2, 110, 110); c.restore(); }
  c.textAlign = "left"; c.fillStyle = ink; setFont(c, "900 32px Fraunces, Georgia, serif", "-0.5px"); c.fillText("N3W YORKERS", logo ? 216 : 80, fy + 30);
  c.fillStyle = dim; setFont(c, "500 15px 'IBM Plex Mono', monospace", "2px"); c.fillText("N3WYORKERS.COM/MLOWTAR  ·  ART, NOT AN INVESTMENT", logo ? 216 : 80, fy + 58);
  setFont(c, "italic 500 21px Fraunces, Georgia, serif"); wrapText(c, res.closer || "", logo ? 216 : 80, fy + 90, W - (logo ? 296 : 160), 26, 2);
  awning(c, 0, H - 134, W, 40);
  // the paper, last: a CC0 scan (ambientCG Paper001) multiplied over everything so the ticket reads as a thing
  if (paperTex) { c.save(); c.globalCompositeOperation = dark ? "soft-light" : "multiply"; c.globalAlpha = dark ? 0.5 : 0.85; c.drawImage(paperTex, 0, 0, W, H); c.restore(); }
  return cv;
}
export const ticketAspect = W / H;
