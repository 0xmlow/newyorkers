/* The ticket MLOWTAR prints. One canvas, drawn from a seed, no two alike.
 *
 * Three systems share the art panel, the way MLow asked for them mixed:
 *   MEMORIES   the bloom grid, the identicon seal, the torn and perforated edges, the barcode and the seeded
 *              noise field are ports of MLow's Memories renderers (memories/site/renderers/core.js and
 *              helpers2.js), rewritten for Canvas 2D so the ticket can carry raster stickers and real fonts.
 *   GLYPHS     a one bit geometric glyph set in the Visualize Value idiom: a bagel, a slice, a manhole, a
 *              subway bullet, a water tower, a hydrant, a token, a MetroCard, the anthora cup, a pigeon, a
 *              stoop, a bridge, the nazar, a check; then (2026-10-12, the second set) a pretzel, a dirty
 *              water dog, a cab, a fire escape, a bishop's crook lamppost, a cone, the Con Ed steam stack,
 *              a hoop, a Citi Bike, Liberty's crown, the Empire State, an umbrella, a rat, the ferry, the
 *              DON'T WALK hand, a mailbox, the Wonder Wheel, the Unisphere, a tenement, the Washington
 *              Square arch, a halal cart, the Grand Central clock at eleven eleven, a sidewalk shed.
 *              Circles, rectangles and arcs only. Black on paper. Knockouts in the paper colour.
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
/* ko: draw in the paper colour (a knockout). ink: strokes in the current fill. Both leave the context as found,
   so a glyph can be used as a mask (maskedGlyph sets G._paper to the ink and every knockout paints solid). */
function ko(c, f) { const p = c.fillStyle, q = c.strokeStyle; c.fillStyle = c.strokeStyle = G._paper; f(); c.fillStyle = p; c.strokeStyle = q; }
function ink(c, f) { const q = c.strokeStyle, lw = c.lineWidth, lc = c.lineCap, lj = c.lineJoin; c.strokeStyle = c.fillStyle; f(); c.strokeStyle = q; c.lineWidth = lw; c.lineCap = lc; c.lineJoin = lj; }
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

  /* ---- the second set (2026-10-12) ---- */
  pretzel(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.13; c.lineCap = "round";
      c.beginPath(); c.ellipse(x, y + s * 0.04, s * 0.42, s * 0.36, 0, 0, 7); c.stroke();                                         // the ring
      c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.2); c.bezierCurveTo(x + s * 0.12, y - s * 0.3, x - s * 0.12, y + s * 0.42, x + s * 0.18, y + s * 0.4); c.stroke();   // one arm
      c.beginPath(); c.moveTo(x + s * 0.3, y - s * 0.2); c.bezierCurveTo(x - s * 0.12, y - s * 0.3, x + s * 0.12, y + s * 0.42, x - s * 0.18, y + s * 0.4); c.stroke(); });  // the other, crossing it
    ko(c, () => { for (const [dx, dy] of [[-0.42, -0.1], [0.4, -0.14], [-0.2, -0.34], [0.26, -0.33], [-0.36, 0.26], [0.38, 0.22], [0.02, 0.4]]) c.fillRect(x + dx * s - s * 0.02, y + dy * s - s * 0.02, s * 0.04, s * 0.04); }); },   // the salt
  hotdog(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(-0.35);
    rr(c, -s * 0.5, -s * 0.2, s, s * 0.4, s * 0.2); c.fill();
    ko(c, () => { rr(c, -s * 0.44, -s * 0.08, s * 0.88, s * 0.16, s * 0.08); c.fill(); });
    rr(c, -s * 0.42, -s * 0.06, s * 0.84, s * 0.12, s * 0.06); c.fill();
    ko(c, () => { c.lineWidth = s * 0.035; c.lineJoin = "miter"; c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(-s * 0.36 + i * s * 0.09, i % 2 ? -s * 0.03 : s * 0.03); c.stroke(); });
    c.restore(); },
  taxi(c, x, y, s) { c.fillRect(x - s * 0.5, y - s * 0.05, s, s * 0.3);
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.05); c.lineTo(x - s * 0.2, y - s * 0.28); c.lineTo(x + s * 0.22, y - s * 0.28); c.lineTo(x + s * 0.34, y - s * 0.05); c.closePath(); c.fill();
    c.fillRect(x - s * 0.08, y - s * 0.36, s * 0.16, s * 0.08);
    ko(c, () => { c.beginPath(); c.moveTo(x - s * 0.24, y - s * 0.07); c.lineTo(x - s * 0.16, y - s * 0.24); c.lineTo(x - s * 0.02, y - s * 0.24); c.lineTo(x - s * 0.02, y - s * 0.07); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + s * 0.02, y - s * 0.07); c.lineTo(x + s * 0.02, y - s * 0.24); c.lineTo(x + s * 0.19, y - s * 0.24); c.lineTo(x + s * 0.28, y - s * 0.07); c.closePath(); c.fill();
      for (let i = 0; i < 10; i++) if (i % 2) c.fillRect(x - s * 0.5 + i * s * 0.1, y + s * 0.06, s * 0.1, s * 0.05);
      for (const dx of [-0.28, 0.28]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.25, s * 0.13, 0, 7); c.fill(); } });
    for (const dx of [-0.28, 0.28]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.25, s * 0.1, 0, 7); c.fill(); ko(c, () => { c.beginPath(); c.arc(x + dx * s, y + s * 0.25, s * 0.04, 0, 7); c.fill(); }); } },
  fireescape(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.05; c.lineCap = "butt";
    for (let i = 0; i < 3; i++) { const ly = y - s * 0.4 + i * s * 0.36; c.fillRect(x - s * 0.5, ly, s, s * 0.05);
      for (let j = 0; j <= 5; j++) c.fillRect(x - s * 0.5 + j * s * 0.2 - s * 0.02, ly - s * 0.16, s * 0.04, s * 0.16);
      c.fillRect(x - s * 0.5, ly - s * 0.19, s, s * 0.035);
      if (i < 2) { c.beginPath(); c.moveTo(x + s * 0.45, ly + s * 0.05); c.lineTo(x - s * 0.1, ly + s * 0.36); c.stroke(); } } }); },
  lamppost(c, x, y, s) { c.fillRect(x - s * 0.04, y - s * 0.2, s * 0.08, s * 0.66); c.fillRect(x - s * 0.16, y + s * 0.42, s * 0.32, s * 0.06);
    ink(c, () => { c.lineWidth = s * 0.07; c.lineCap = "round"; c.beginPath(); c.arc(x + s * 0.18, y - s * 0.2, s * 0.18, Math.PI, 0); c.stroke(); });
    c.beginPath(); c.moveTo(x + s * 0.26, y - s * 0.2); c.lineTo(x + s * 0.46, y - s * 0.2); c.lineTo(x + s * 0.42, y + s * 0.02); c.lineTo(x + s * 0.3, y + s * 0.02); c.closePath(); c.fill();
    c.fillRect(x + s * 0.3, y - s * 0.26, s * 0.12, s * 0.06);
    ko(c, () => c.fillRect(x + s * 0.33, y - s * 0.14, s * 0.06, s * 0.1)); },
  cone(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.14, y - s * 0.46); c.lineTo(x + s * 0.14, y - s * 0.46); c.lineTo(x + s * 0.32, y + s * 0.34); c.lineTo(x - s * 0.32, y + s * 0.34); c.closePath(); c.fill();
    c.fillRect(x - s * 0.48, y + s * 0.34, s * 0.96, s * 0.12);
    ko(c, () => { c.fillRect(x - s * 0.19, y - s * 0.14, s * 0.38, s * 0.08); c.fillRect(x - s * 0.25, y + s * 0.1, s * 0.5, s * 0.07); }); },
  steam(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.1, y - s * 0.1); c.lineTo(x + s * 0.1, y - s * 0.1); c.lineTo(x + s * 0.17, y + s * 0.48); c.lineTo(x - s * 0.17, y + s * 0.48); c.closePath(); c.fill();
    ko(c, () => { for (let i = 0; i < 3; i++) { const yy = i * 0.16, hw = 0.1 + (yy + 0.1) / 0.58 * 0.07; c.fillRect(x - hw * s + s * 0.02, y + yy * s, (hw * 2 - 0.04) * s, s * 0.06); } });
    for (const [dx, dy, r] of [[0, -0.3, 0.17], [-0.2, -0.2, 0.12], [0.22, -0.22, 0.13], [0.06, -0.14, 0.1], [-0.3, -0.36, 0.08], [0.34, -0.38, 0.07]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); } },
  hoop(c, x, y, s) { c.fillRect(x - s * 0.42, y - s * 0.48, s * 0.84, s * 0.5); ko(c, () => c.fillRect(x - s * 0.36, y - s * 0.42, s * 0.72, s * 0.38));
    c.fillRect(x - s * 0.16, y - s * 0.26, s * 0.32, s * 0.22); ko(c, () => c.fillRect(x - s * 0.11, y - s * 0.21, s * 0.22, s * 0.13));
    ink(c, () => { c.lineWidth = s * 0.06; c.beginPath(); c.ellipse(x, y + s * 0.06, s * 0.24, s * 0.07, 0, 0, 7); c.stroke();
      c.lineWidth = s * 0.035; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * s * 0.1, y + s * 0.12); c.lineTo(x + i * s * 0.06, y + s * 0.46); c.stroke(); }
      c.beginPath(); c.moveTo(x - s * 0.15, y + s * 0.3); c.lineTo(x + s * 0.15, y + s * 0.3); c.stroke(); c.beginPath(); c.moveTo(x - s * 0.12, y + s * 0.46); c.lineTo(x + s * 0.12, y + s * 0.46); c.stroke(); }); },
  bike(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.06; c.lineCap = "round"; c.lineJoin = "round";
    for (const dx of [-0.3, 0.3]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.18, s * 0.2, 0, 7); c.stroke(); }
    c.beginPath(); c.moveTo(x - s * 0.3, y + s * 0.18); c.lineTo(x - s * 0.1, y - s * 0.16); c.lineTo(x + s * 0.02, y + s * 0.18); c.lineTo(x + s * 0.22, y - s * 0.2); c.lineTo(x + s * 0.3, y + s * 0.18); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.1, y - s * 0.16); c.lineTo(x + s * 0.22, y - s * 0.2); c.moveTo(x - s * 0.3, y + s * 0.18); c.lineTo(x + s * 0.02, y + s * 0.18); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.22); c.lineTo(x - s * 0.04, y - s * 0.22); c.moveTo(x + s * 0.14, y - s * 0.28); c.lineTo(x + s * 0.32, y - s * 0.28); c.stroke(); });
    for (const dx of [-0.3, 0.3]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.18, s * 0.05, 0, 7); c.fill(); } c.beginPath(); c.arc(x + s * 0.02, y + s * 0.18, s * 0.06, 0, 7); c.fill(); },
  liberty(c, x, y, s) { c.beginPath(); c.arc(x, y + s * 0.08, s * 0.3, 0, 7); c.fill(); c.fillRect(x - s * 0.12, y + s * 0.3, s * 0.24, s * 0.18);
    c.beginPath(); c.arc(x, y + s * 0.08, s * 0.34, Math.PI, 0); c.fill();
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; c.beginPath(); c.moveTo(x + Math.cos(a - 0.09) * s * 0.3, y + s * 0.08 + Math.sin(a - 0.09) * s * 0.3); c.lineTo(x + Math.cos(a) * s * 0.5, y + s * 0.08 + Math.sin(a) * s * 0.5); c.lineTo(x + Math.cos(a + 0.09) * s * 0.3, y + s * 0.08 + Math.sin(a + 0.09) * s * 0.3); c.closePath(); c.fill(); }
    ko(c, () => { for (const dx of [-0.1, 0.1]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.08, s * 0.035, 0, 7); c.fill(); } c.fillRect(x - s * 0.28, y - s * 0.06, s * 0.56, s * 0.03); }); },
  spire(c, x, y, s) { const tiers = [[0.5, 0.34, 0.12], [0.36, 0.1, 0.24], [0.24, -0.12, 0.22], [0.14, -0.3, 0.18], [0.08, -0.4, 0.1]];
    for (const [hw, ty, h] of tiers) c.fillRect(x - hw * s, y + ty * s, hw * 2 * s, h * s); c.fillRect(x - s * 0.02, y - s * 0.5, s * 0.04, s * 0.12);
    ko(c, () => { for (const [hw, ty, h] of tiers) for (let yy = ty + 0.03; yy + 0.04 < ty + h; yy += 0.07) for (let xx = -hw + 0.05; xx + 0.03 < hw - 0.04; xx += 0.08) c.fillRect(x + xx * s, y + yy * s, s * 0.03, s * 0.04); }); },
  umbrella(c, x, y, s) { c.beginPath(); c.arc(x, y + s * 0.02, s * 0.48, Math.PI, 0); c.closePath(); c.fill();
    ko(c, () => { for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - s * 0.36 + i * s * 0.24, y + s * 0.02, s * 0.1, Math.PI, 0); c.fill(); } });
    c.fillRect(x - s * 0.03, y - s * 0.02, s * 0.06, s * 0.4); c.fillRect(x - s * 0.025, y - s * 0.5, s * 0.05, s * 0.06);
    ink(c, () => { c.lineWidth = s * 0.06; c.lineCap = "round"; c.beginPath(); c.arc(x - s * 0.1, y + s * 0.38, s * 0.1, 0, Math.PI); c.stroke(); }); },
  rat(c, x, y, s) { c.beginPath(); c.ellipse(x - s * 0.05, y + s * 0.08, s * 0.34, s * 0.2, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x + s * 0.18, y - s * 0.06); c.lineTo(x + s * 0.5, y + s * 0.1); c.lineTo(x + s * 0.2, y + s * 0.24); c.closePath(); c.fill();
    c.beginPath(); c.arc(x + s * 0.2, y - s * 0.1, s * 0.09, 0, 7); c.fill();
    ko(c, () => { c.beginPath(); c.arc(x + s * 0.2, y - s * 0.1, s * 0.04, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 0.3, y + s * 0.06, s * 0.03, 0, 7); c.fill(); });
    ink(c, () => { c.lineWidth = s * 0.05; c.lineCap = "round"; c.beginPath(); c.moveTo(x - s * 0.38, y + s * 0.1); c.quadraticCurveTo(x - s * 0.52, y, x - s * 0.46, y - s * 0.28); c.stroke(); });
    for (const dx of [-0.2, 0.05]) c.fillRect(x + dx * s, y + s * 0.24, s * 0.05, s * 0.1); },
  ferry(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.5, y + s * 0.1); c.lineTo(x + s * 0.5, y + s * 0.1); c.lineTo(x + s * 0.42, y + s * 0.34); c.lineTo(x - s * 0.42, y + s * 0.34); c.closePath(); c.fill();
    c.fillRect(x - s * 0.38, y - s * 0.12, s * 0.76, s * 0.22); c.fillRect(x - s * 0.26, y - s * 0.3, s * 0.52, s * 0.18); c.fillRect(x - s * 0.04, y - s * 0.46, s * 0.08, s * 0.16);
    ko(c, () => { for (let i = 0; i < 7; i++) c.fillRect(x - s * 0.33 + i * s * 0.1, y - s * 0.06, s * 0.06, s * 0.08); for (let i = 0; i < 4; i++) c.fillRect(x - s * 0.2 + i * s * 0.12, y - s * 0.25, s * 0.07, s * 0.08); });
    ink(c, () => { c.lineWidth = s * 0.04; c.lineJoin = "round"; c.beginPath(); for (let i = 0; i <= 6; i++) c.lineTo(x - s * 0.48 + i * s * 0.16, y + s * 0.44 + (i % 2 ? -s * 0.03 : s * 0.03)); c.stroke(); }); },
  hand(c, x, y, s) { rr(c, x - s * 0.26, y - s * 0.1, s * 0.52, s * 0.4, s * 0.1); c.fill();
    for (const [dx, ty, h] of [[-0.21, -0.42, 0.24], [-0.07, -0.5, 0.34], [0.07, -0.48, 0.32], [0.2, -0.4, 0.26]]) { rr(c, x + dx * s - s * 0.055, y + ty * s, s * 0.11, h * s + s * 0.1, s * 0.05); c.fill(); }
    c.save(); c.translate(x - s * 0.3, y); c.rotate(-0.7); rr(c, -s * 0.055, -s * 0.26, s * 0.11, s * 0.3, s * 0.05); c.fill(); c.restore();
    c.fillRect(x - s * 0.14, y + s * 0.3, s * 0.28, s * 0.18); },
  mailbox(c, x, y, s) { c.beginPath(); c.arc(x, y - s * 0.14, s * 0.32, Math.PI, 0); c.fill(); c.fillRect(x - s * 0.32, y - s * 0.14, s * 0.64, s * 0.4);
    ko(c, () => { rr(c, x - s * 0.22, y - s * 0.1, s * 0.44, s * 0.08, s * 0.03); c.fill(); c.fillRect(x - s * 0.26, y + s * 0.1, s * 0.52, s * 0.03); });
    for (const dx of [-0.22, 0.22]) c.fillRect(x + dx * s - s * 0.04, y + s * 0.26, s * 0.08, s * 0.2); },
  wheel(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.045; c.beginPath(); c.arc(x, y - s * 0.04, s * 0.4, 0, 7); c.stroke(); c.beginPath(); c.arc(x, y - s * 0.04, s * 0.14, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * s * 0.14, y - s * 0.04 + Math.sin(a) * s * 0.14); c.lineTo(x + Math.cos(a) * s * 0.4, y - s * 0.04 + Math.sin(a) * s * 0.4); c.stroke(); }
      c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(x, y - s * 0.04); c.lineTo(x - s * 0.3, y + s * 0.48); c.moveTo(x, y - s * 0.04); c.lineTo(x + s * 0.3, y + s * 0.48); c.stroke(); });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.4, y - s * 0.04 + Math.sin(a) * s * 0.4, s * 0.06, 0, 7); c.fill(); }
    c.beginPath(); c.arc(x, y - s * 0.04, s * 0.06, 0, 7); c.fill(); },
  globe(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.05; c.beginPath(); c.arc(x, y - s * 0.02, s * 0.4, 0, 7); c.stroke();
      for (const k of [0.16, 0.3]) { c.beginPath(); c.ellipse(x, y - s * 0.02, k * s, s * 0.4, 0, 0, 7); c.stroke(); }
      for (const k of [-0.2, 0, 0.2]) { const hw = Math.sqrt(0.16 - k * k); c.beginPath(); c.moveTo(x - hw * s, y - s * 0.02 + k * s); c.lineTo(x + hw * s, y - s * 0.02 + k * s); c.stroke(); }
      c.lineWidth = s * 0.035; c.beginPath(); c.ellipse(x, y - s * 0.02, s * 0.5, s * 0.16, -0.4, 0, 7); c.stroke();
      c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(x - s * 0.1, y + s * 0.38); c.lineTo(x - s * 0.22, y + s * 0.48); c.moveTo(x + s * 0.1, y + s * 0.38); c.lineTo(x + s * 0.22, y + s * 0.48); c.stroke(); }); },
  tenement(c, x, y, s) { c.fillRect(x - s * 0.3, y - s * 0.44, s * 0.6, s * 0.92); c.fillRect(x - s * 0.34, y - s * 0.48, s * 0.68, s * 0.06);
    ko(c, () => { for (let r = 0; r < 5; r++) for (let k = -1; k <= 1; k++) c.fillRect(x + k * s * 0.17 - s * 0.045, y - s * 0.36 + r * s * 0.15, s * 0.09, s * 0.1);
      c.beginPath(); c.arc(x, y + s * 0.32, s * 0.07, Math.PI, 0); c.fill(); c.fillRect(x - s * 0.07, y + s * 0.32, s * 0.14, s * 0.16); }); },
  arch(c, x, y, s) { c.fillRect(x - s * 0.46, y - s * 0.3, s * 0.92, s * 0.78); c.fillRect(x - s * 0.5, y - s * 0.46, s, s * 0.16);
    ko(c, () => { c.beginPath(); c.arc(x, y + s * 0.02, s * 0.24, Math.PI, 0); c.fill(); c.fillRect(x - s * 0.24, y + s * 0.02, s * 0.48, s * 0.46); c.fillRect(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.04);
      for (const dx of [-0.38, 0.3]) c.fillRect(x + dx * s, y - s * 0.2, s * 0.08, s * 0.5); }); },
  cart(c, x, y, s) { c.fillRect(x - s * 0.36, y - s * 0.08, s * 0.72, s * 0.36); ko(c, () => c.fillRect(x - s * 0.3, y - s * 0.02, s * 0.6, s * 0.14));
    c.fillRect(x - s * 0.02, y - s * 0.36, s * 0.04, s * 0.3); c.beginPath(); c.arc(x, y - s * 0.1, s * 0.38, Math.PI, 0); c.closePath(); c.fill();
    ko(c, () => { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - s * 0.25 + i * s * 0.25, y - s * 0.1, s * 0.09, Math.PI, 0); c.fill(); } });
    for (const dx of [-0.24, 0.24]) { c.beginPath(); c.arc(x + dx * s, y + s * 0.36, s * 0.1, 0, 7); c.fill(); ko(c, () => { c.beginPath(); c.arc(x + dx * s, y + s * 0.36, s * 0.04, 0, 7); c.fill(); }); } },
  clock(c, x, y, s) { c.beginPath(); c.arc(x, y, s * 0.48, 0, 7); c.fill(); ko(c, () => { c.beginPath(); c.arc(x, y, s * 0.4, 0, 7); c.fill(); });
    ink(c, () => { c.lineWidth = s * 0.04; c.lineCap = "round"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r1 = i % 3 ? 0.34 : 0.3; c.beginPath(); c.moveTo(x + Math.cos(a) * r1 * s, y + Math.sin(a) * r1 * s); c.lineTo(x + Math.cos(a) * s * 0.38, y + Math.sin(a) * s * 0.38); c.stroke(); }
      c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(x, y); c.lineTo(x - s * 0.1, y - s * 0.17); c.moveTo(x, y); c.lineTo(x + s * 0.27, y - s * 0.12); c.stroke(); });   // eleven eleven
    c.beginPath(); c.arc(x, y, s * 0.05, 0, 7); c.fill(); },
  scaffold(c, x, y, s) { ink(c, () => { c.lineWidth = s * 0.05; c.lineCap = "butt";
    for (const dx of [-0.42, 0, 0.42]) { c.beginPath(); c.moveTo(x + dx * s, y - s * 0.44); c.lineTo(x + dx * s, y + s * 0.48); c.stroke(); }
    for (const yy of [-0.48, -0.02, 0.44]) c.fillRect(x - s * 0.5, y + yy * s, s, s * 0.06);
    c.lineWidth = s * 0.035; for (const [x0, y0] of [[-0.42, -0.42], [0, -0.42], [-0.42, 0.04], [0, 0.04]]) { c.beginPath(); c.moveTo(x + x0 * s, y + y0 * s); c.lineTo(x + (x0 + 0.42) * s, y + (y0 + 0.4) * s); c.stroke(); } }); },
};
/* per theme, solid silhouettes first: index 0 is the halftone mask in the poster and stack layouts, 1 the hero stamp */
const GLYPH_BY_THEME = {
  love: ["heart", "umbrella", "bridge", "pigeon", "cup", "ferry", "wheel"],
  money: ["token", "taxi", "check", "metrocard", "manhole", "cart", "mailbox"],
  work: ["cup", "cone", "tower", "metrocard", "scaffold", "spire", "hand", "bridge"],
  home: ["stoop", "tenement", "tower", "hydrant", "bagel", "mailbox", "fireescape"],
  move: ["bullet", "taxi", "metrocard", "token", "ferry", "bike", "hand", "bridge"],
  food: ["bagel", "pretzel", "slice", "hotdog", "cup", "cart", "pigeon"],
  art: ["eyeflower", "arch", "star", "nazar", "check", "globe", "wheel"],
  luck: ["star", "clock", "token", "check", "nazar", "liberty", "umbrella"],
  lost: ["manhole", "lamppost", "pigeon", "nazar", "stoop", "rat", "globe"],
  night: ["tower", "lamppost", "bullet", "star", "cup", "taxi", "rat", "steam"],
  family: ["stoop", "tenement", "bagel", "heart", "pigeon", "ferry", "umbrella"],
  fame: ["star", "liberty", "check", "bullet", "eyeflower", "spire", "wheel"],
  city: ["manhole", "steam", "hydrant", "tower", "bullet", "taxi", "cone", "scaffold"],
  future: ["bridge", "spire", "tower", "eyeflower", "check", "globe", "clock"],
  wander: ["pigeon", "arch", "manhole", "hydrant", "slice", "lamppost", "bike", "ferry"],
  health: ["heart", "umbrella", "cup", "bagel", "clock", "hand", "pigeon"],
  law: ["hand", "arch", "check", "mailbox", "scaffold", "clock", "liberty"],
  politics: ["liberty", "arch", "hand", "mailbox", "globe", "check", "steam"],
};
const BULLETS = ["1", "4", "7", "A", "B", "G", "J", "L", "N"];
G._paper = PAPER;
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
/* two families share the drawer: the blue delft props and the Open Eye Flower objects. A ticket leads with one
   and answers with the other, so the hero and its company come from different registers. */
async function pickStickers(r, theme, n, lead) {
  const all = await loadDrawer(); if (!all || !all.length) return [];
  const fam = f => all.filter(s => (s[4] || "prop") === f), byTheme = list => { const want = list.filter(s => s[3].includes(theme)), any = list.filter(s => s[3].includes("any")); return (want.length >= 4 ? want : want.concat(any)).slice(); };
  const first = byTheme(fam(lead)), second = byTheme(fam(lead === "eye" ? "prop" : "eye")), out = [];
  const draw = pool => { if (!pool.length) return null; const i = Math.floor(r() * pool.length); return pool.splice(i, 1)[0]; };
  const h = draw(first); if (h) out.push(h);                                   // the hero from the lead family
  while (out.length < n) { const s = draw(out.length % 2 ? first : second) || draw(second) || draw(first); if (!s) break; out.push(s); }
  const imgs = await Promise.all(out.map(s => img(BASE + "assets/mlowtar/stickers/" + s[0] + ".png")));
  return out.map((s, i) => ({ meta: s, im: imgs[i], family: s[4] || "prop" })).filter(s => s.im);
}
function stamp(c, im, x, y, size, rot, shadow) {
  const ar = im.width / im.height, w = ar >= 1 ? size : size * ar, h = ar >= 1 ? size / ar : size;
  c.save(); c.translate(x, y); c.rotate(rot); if (shadow) { c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = size * 0.08; c.shadowOffsetY = size * 0.03; }
  c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
}

/* ---------- the art panel: a composition engine, not a scatter ----------
 * An armature (a 6 x 6 grid with the seal's corner and the tag's corner reserved), eight layouts, and a strict
 * hierarchy: one dominant form, one secondary, a few accents, and at least a third of the paper left alone.
 * Layers, back to front: ground > field > dominant > secondary > accents > overprint. Stickers and halftones
 * can live inside a glyph's silhouette (masked layers), stickers can be struck as duotone, and flat colour
 * shapes overprint with a slight misregistration, the risograph way. Every choice is seeded. */
const off = (w, h) => { const o = document.createElement("canvas"); o.width = Math.max(1, Math.round(w)); o.height = Math.max(1, Math.round(h)); return o; };
/* a layer the size of the panel whose content is kept only inside a glyph's silhouette */
function maskedGlyph(S, glyph, gx, gy, gs, draw, paperFor) {
  const o = off(S, S), x = o.getContext("2d"); draw(x);
  // the mask is the glyph's whole silhouette: knockouts painted solid too, on their own canvas, then kept with destination-in
  const m = off(S, S), mx = m.getContext("2d"); mx.fillStyle = "#000"; G._paper = "#000"; G[glyph](mx, gx, gy, gs, "N"); G._paper = paperFor;
  x.globalCompositeOperation = "destination-in"; x.drawImage(m, 0, 0); x.globalCompositeOperation = "source-over";
  return o;
}
function halftone(x, w, h, color, angle, cell, bias) {   // dots that grow along a direction
  x.fillStyle = color; const ca = Math.cos(angle), sa = Math.sin(angle), L = Math.abs(w * ca) + Math.abs(h * sa);
  for (let yy = -cell; yy < h + cell; yy += cell) for (let xx = -cell + ((yy / cell) % 2) * cell / 2; xx < w + cell; xx += cell) {
    const t = ((xx - w / 2) * ca + (yy - h / 2) * sa) / L + 0.5; const rad = Math.max(0, (bias ? t : 1 - t) * cell * 0.62 - 0.4); if (rad > 0.5) { x.beginPath(); x.arc(xx, yy, rad, 0, 7); x.fill(); } }
}
function hatch(x, w, h, color, angle, gap, lw) { x.strokeStyle = color; x.lineWidth = lw; x.save(); x.translate(w / 2, h / 2); x.rotate(angle); for (let k = -w - h; k < w + h; k += gap) { x.beginPath(); x.moveTo(k, -h - w); x.lineTo(k, h + w); x.stroke(); } x.restore(); }
function tornPiece(c, r, x, y, w, h, fill, shadow) {   // a cut paper shape, the Memories torn edge on every side
  const pts = []; const amp = Math.min(w, h) * 0.035, n = 9;
  for (let i = 0; i <= n; i++) pts.push([x + w * i / n, y + (r() - 0.5) * amp]); for (let i = 1; i <= n; i++) pts.push([x + w + (r() - 0.5) * amp, y + h * i / n]);
  for (let i = n - 1; i >= 0; i--) pts.push([x + w * i / n, y + h + (r() - 0.5) * amp]); for (let i = n - 1; i >= 1; i--) pts.push([x + (r() - 0.5) * amp, y + h * i / n]);
  c.save(); if (shadow) { c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = 14; c.shadowOffsetY = 6; } c.fillStyle = fill; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.restore();
}
function duotoneOf(im, size, hex) { return dithered(im, size, hex); }
function stickerAt(c, s, cx, cy, size, rot, o) {   // o: {shadow, duo:hex, alpha}
  if (!s || !s.im) return; const im = o && o.duo ? duotoneOf(s.im, size, o.duo) : s.im;
  c.save(); if (o && o.alpha != null) c.globalAlpha = o.alpha; stamp(c, im, cx, cy, size, rot, !(o && o.duo) && !(o && o.flat)); c.restore();
}
function overprint(c, r, P, x, y, w, h, shape) {       // a flat colour form in multiply, nudged like a second pass through the press
  c.save(); c.globalCompositeOperation = "multiply"; c.globalAlpha = 0.85; c.fillStyle = P.acc2; const dx = (r() - 0.5) * 8, dy = (r() - 0.5) * 8;
  if (shape === "circle") { c.beginPath(); c.arc(x + w / 2 + dx, y + h / 2 + dy, Math.min(w, h) / 2, 0, 7); c.fill(); } else { rr(c, x + dx, y + dy, w, h, Math.min(w, h) * 0.08); c.fill(); }
  c.restore();
}
async function artPanel(c, r, res, P, x0, y0, S) {
  const theme = res.theme || "wander"; G._paper = P.bg; const glyphs = GLYPH_BY_THEME[theme] || GLYPH_BY_THEME.wander, train = res.lucky && res.lucky.train;
  const u = S / 6, cx = k => x0 + k * u, cy = k => y0 + k * u;          // the armature
  const lead = r() < 0.5 ? "prop" : "eye", st = await pickStickers(r, theme, 5, lead), hero = st[0], rest = st.slice(1);
  const layout = (u => u < 0.16 ? "poster" : u < 0.32 ? "window" : u < 0.44 ? "grid" : u < 0.58 ? "diagonal" : u < 0.68 ? "stack" : u < 0.76 ? "orbit" : u < 0.88 ? "split" : "cutpaper")(r());   // weighted toward the richer layouts
  const dark = P.name === "night", inkA = a => dark ? `rgba(236,232,221,${a})` : `rgba(20,18,16,${a})`;
  c.save(); c.beginPath(); c.rect(x0, y0, S, S); c.clip();
  c.fillStyle = P.bg; c.fillRect(x0, y0, S, S);
  /* ground: always quiet, one of four */
  const ground = Math.floor(r() * 4);
  if (ground === 0) { const nz = noise2d(res.seed), sc = 2 + r() * 2; c.strokeStyle = inkA(0.12); c.lineWidth = 1.2;
    for (let lv = 0.3; lv < 0.95; lv += 0.1) for (let gy = 0; gy < 50; gy++) { let on = false; c.beginPath(); for (let gx = 0; gx <= 50; gx++) { const v = nz(gx / 50 * sc, gy / 50 * sc + res.seed % 7), px = x0 + gx / 50 * S, py = y0 + gy / 50 * S; if (Math.abs(v - lv) < 0.025) { if (!on) { c.moveTo(px, py); on = true; } else c.lineTo(px, py); } else on = false; } c.stroke(); } }
  else if (ground === 1) { c.save(); c.globalAlpha = 0.18; hatch(c, S, S, dark ? "#ECE8DD" : "#141210", r() * Math.PI, 16 + r() * 8, 1.5); c.restore(); }
  else if (ground === 2) { const o = off(S, S), x = o.getContext("2d"); halftone(x, S, S, inkA(0.35), r() * Math.PI, 22, r() < 0.5); c.drawImage(o, x0, y0); }
  /* ground 3: plain paper */

  if (layout === "poster") {
    /* a giant glyph top right as a halftone field, the hero sticker on the lower left golden point, accents in a row */
    const g = glyphs[0], o = maskedGlyph(S, g, 3.8 * u, 2.3 * u, 4.2 * u, x => halftone(x, S, S, P.acc, Math.PI / 3, 14, true), P.bg); c.drawImage(o, x0, y0);
    c.fillStyle = P.ink; G[glyphs[1]](c, cx(4.6), cy(4.6), u * 1.1, train);
    stickerAt(c, hero, cx(2.3), cy(3.7), u * 3.6, (r() - 0.5) * 0.2, { shadow: true });
    rest.slice(0, 2).forEach((s, i) => stickerAt(c, s, cx(4.3 + i * 1.1), cy(5.1), u * 1.1, (r() - 0.5) * 0.5, { duo: dark ? P.acc : P.ink }));
  } else if (layout === "window") {
    /* a big window cut in the shape of a glyph (bagel, bullet, MetroCard), a duotone sticker living inside it, a colour sticker crossing the edge */
    const win = ["bagel", "bullet", "metrocard", "manhole", "nazar", "pretzel", "clock", "hand", "umbrella", "token"][Math.floor(r() * 10)];
    const o = maskedGlyph(S, win, 3 * u, 2.9 * u, 4.6 * u, x => { x.fillStyle = P.acc; x.fillRect(0, 0, S, S); if (rest[0]) stickerAt(x, rest[0], 3 * u, 2.9 * u, u * 3.2, (r() - 0.5) * 0.3, { duo: P.bg, flat: true }); }, P.bg); c.drawImage(o, x0, y0);
    c.fillStyle = P.ink; G[win](c, cx(3), cy(2.9), u * 4.6 + 10); c.fillStyle = P.bg; G[win](c, cx(3), cy(2.9), u * 4.6 - 14); c.drawImage(o, x0, y0);   // a ring of ink round the window
    stickerAt(c, hero, cx(4.2), cy(4.1), u * 2.4, (r() - 0.5) * 0.4, { shadow: true });
    c.fillStyle = P.ink; G[glyphs[2]](c, cx(1.1), cy(1.1), u * 0.9, train);
  } else if (layout === "grid") {
    /* a 3 x 3 with one 2 x 2 merged for the hero; the rest alternate glyph and duotone sticker; thin rules */
    const m = u * 0.45, cell = (S - 2 * m) / 3, big = Math.floor(r() * 4), bigPos = [[0, 0], [1, 0], [0, 1], [1, 1]][big]; let si = 0, gi = 0;
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      const inBig = gx >= bigPos[0] && gx <= bigPos[0] + 1 && gy >= bigPos[1] && gy <= bigPos[1] + 1; if (inBig && !(gx === bigPos[0] && gy === bigPos[1])) continue;
      const w = inBig ? 2 * cell : cell, px = x0 + m + gx * cell, py = y0 + m + gy * cell;
      if (inBig) { c.fillStyle = P.acc2; c.fillRect(px + 6, py + 6, w - 12, w - 12); stickerAt(c, hero, px + w / 2, py + w / 2, w * 0.82, (r() - 0.5) * 0.2, { shadow: true }); }
      else if ((gx + gy) % 2 === 0 && rest[si]) stickerAt(c, rest[si++], px + cell / 2, py + cell / 2, cell * 0.76, (r() - 0.5) * 0.3, { duo: r() < 0.5 ? P.acc : P.ink });
      else { c.fillStyle = (gx + gy) % 3 ? P.ink : P.acc; G[glyphs[gi++ % glyphs.length]](c, px + cell / 2, py + cell / 2, cell * 0.5, BULLETS[(gx * 3 + gy) % 9]); }
    }
    c.strokeStyle = inkA(0.5); c.lineWidth = 1.5; for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(x0 + m + k * cell, y0 + m); c.lineTo(x0 + m + k * cell, y0 + S - m); c.moveTo(x0 + m, y0 + m + k * cell); c.lineTo(x0 + S - m, y0 + m + k * cell); c.stroke(); }
  } else if (layout === "diagonal") {
    /* a band of colour from bottom left to top right, forms marching along it, scale falling away */
    c.save(); c.translate(cx(3), cy(3)); c.rotate(-Math.PI / 4); c.fillStyle = P.acc; c.fillRect(-S, -u * 0.9, 2 * S, u * 1.8); c.restore();
    const o = maskedGlyph(S, glyphs[0], 4.7 * u, 1.3 * u, 2.2 * u, x => halftone(x, S, S, P.ink, Math.PI / 4, 12, false), P.bg); c.drawImage(o, x0, y0);
    const path = [[1.7, 4.4, 2.5], [3.1, 3.0, 1.6], [4.3, 1.9, 1.1]];
    path.forEach(([px, py, sz], i) => { const s = i === 0 ? hero : rest[i - 1]; if (s) stickerAt(c, s, cx(px), cy(py), u * sz, -Math.PI / 4 + (r() - 0.5) * 0.3, i === 0 ? { shadow: true } : { duo: P.bg, flat: true }); });
    c.fillStyle = P.ink; G[glyphs[1]](c, cx(1.0), cy(1.2), u * 0.9, train);
  } else if (layout === "stack") {
    /* a tall flat form on the centre line, forms stacked up it, overlapping, each with its shadow */
    tornPiece(c, r, cx(1.6), cy(0.6), u * 2.8, u * 4.9, P.acc2, true);
    const col = [[3, 4.3, 2.6, hero], [3.2, 2.5, 2.0, rest[0]], [2.8, 1.2, 1.4, rest[1]]];
    col.forEach(([px, py, sz, s], i) => stickerAt(c, s, cx(px), cy(py), u * sz, (r() - 0.5) * 0.3, { shadow: true }));
    c.fillStyle = P.ink; G[glyphs[0]](c, cx(5.0), cy(4.0), u * 1.1, train); G[glyphs[1]](c, cx(1.0), cy(2.0), u * 0.8, train);
    overprint(c, r, P, cx(1.9), cy(3.6), u * 2.2, u * 2.2, "circle");
  } else if (layout === "orbit") {
    /* the hero in the middle struck as a token, small duotone forms on a ring, a thin ring rule */
    c.strokeStyle = inkA(0.6); c.lineWidth = 1.5; c.beginPath(); c.arc(cx(3), cy(3), u * 2.35, 0, 7); c.stroke();
    stampCoin(c, hero.im, cx(3), cy(3), u * 2.7, (r() - 0.5) * 0.2, P.acc2, P.bg);
    const n = 6; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2, px = cx(3) + Math.cos(a) * u * 2.35, py = cy(3) + Math.sin(a) * u * 2.35;
      if (i % 2 === 0 && rest[i / 2]) { c.fillStyle = P.bg; c.beginPath(); c.arc(px, py, u * 0.6, 0, 7); c.fill(); stickerAt(c, rest[i / 2], px, py, u * 0.95, (r() - 0.5) * 0.6, { duo: dark ? P.acc : P.ink }); }
      else { c.fillStyle = P.bg; c.beginPath(); c.arc(px, py, u * 0.5, 0, 7); c.fill(); c.fillStyle = P.ink; G[glyphs[(i / 2 | 0) % glyphs.length]](c, px, py, u * 0.7, BULLETS[i % 9]); } }
  } else if (layout === "split") {
    /* the panel split by a vertical band; a glyph knocked out of the band; the hero straddles the seam */
    const bx = cx(r() < 0.5 ? 0.8 : 3.4), bw = u * 1.8; c.fillStyle = P.acc; c.fillRect(bx, y0, bw, S);
    c.fillStyle = P.bg; G[glyphs[0]](c, bx + bw / 2, cy(1.5), u * 1.3, train);
    stickerAt(c, hero, Math.min(Math.max(bx + bw / 2 + (r() < 0.5 ? -u * 0.6 : u * 0.6), cx(1.8)), cx(4.2)), cy(3.9), u * 3.0, (r() - 0.5) * 0.2, { shadow: true });
    const o = maskedGlyph(S, glyphs[1], bx + bw / 2 + (bx < cx(2) ? u * 3.2 : -u * 2.4), cy(1.5), u * 1.6, x => halftone(x, S, S, P.ink, 0, 10, true), P.bg); c.drawImage(o, x0, y0);
    rest.slice(0, 1).forEach(s => stickerAt(c, s, bx < cx(2) ? cx(4.9) : cx(1.1), cy(4.9), u * 1.1, (r() - 0.5) * 0.5, { duo: P.ink }));
  } else {
    /* cut paper: three torn pieces in bg, acc2 and ink tints, stickers pinned on them, one glyph as a stamp */
    tornPiece(c, r, cx(0.7), cy(0.9), u * 3.2, u * 2.6, P.acc2, true);
    tornPiece(c, r, cx(2.4), cy(2.4), u * 3.0, u * 3.0, dark ? "#1b2a3c" : "#ffffff", true);
    tornPiece(c, r, cx(0.9), cy(3.9), u * 2.0, u * 1.5, P.acc, true);
    stickerAt(c, hero, cx(3.9), cy(3.9), u * 2.6, (r() - 0.5) * 0.3, { shadow: true });
    stickerAt(c, rest[0], cx(2.0), cy(2.0), u * 1.6, (r() - 0.5) * 0.4, { shadow: true });
    stickerAt(c, rest[1], cx(1.9), cy(4.6), u * 1.1, (r() - 0.5) * 0.5, { duo: P.bg, flat: true });
    c.fillStyle = P.ink; G[glyphs[0]](c, cx(5.0), cy(1.2), u * 1.0, train);
  }
  /* accents: two small glyphs as a row in the top left, only where the layout leaves that corner quiet */
  if (["poster", "split", "cutpaper", "stack", "diagonal"].includes(layout)) for (let i = 0; i < 2; i++) { c.save(); c.globalAlpha = 0.55; c.fillStyle = i ? P.acc : P.ink; G[glyphs[(i + 2) % glyphs.length]](c, cx(0.55 + i * 0.75), cy(0.55), u * 0.42, BULLETS[i % 9]); c.restore(); }
  /* the seal and the tag, in their reserved corners */
  const seal = S * 0.11; c.fillStyle = P.bg; c.beginPath(); c.arc(x0 + S - seal * 0.9, y0 + seal * 0.9, seal * 0.78, 0, 7); c.fill();
  identicon(c, (res.question || "") + "|" + res.seed, x0 + S - seal * 1.35, y0 + seal * 0.45, seal * 0.9, 5, P.ink, P.acc);
  const tag = THEME_WORD[theme] || THEME_WORD.wander; setFont(c, "700 22px 'IBM Plex Mono', monospace", "3px"); const tw = c.measureText(tag).width + 44;
  c.fillStyle = P.acc2; rr(c, x0 + 22, y0 + S - 68, tw, 46, 6); c.fill(); c.fillStyle = INK; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(tag, x0 + 44, y0 + S - 45); setFont(c, c.font);
  c.restore();
  c.strokeStyle = dark ? GOLD : INK; c.lineWidth = 3; c.strokeRect(x0 + 1.5, y0 + 1.5, S - 3, S - 3);
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
/* The QR: black on white, a four module quiet zone, cells snapped to whole pixels so no edge is grey. Error correction
   L keeps the symbol small (a replay link is about 100 bytes, version 5 or 6, 37 to 41 modules); the symbol is drawn after
   the paper texture so nothing softens it (2026-10-13: the old 112 px gold symbol under the paper did not scan). */
function drawQR(c, text, x, y, size, dark, light) {
  try { const q = window.qrcode(0, "L"); q.addData(text); q.make(); const n = q.getModuleCount(), cell = Math.floor(size / (n + 8)), ox = Math.round(x + (size - cell * n) / 2), oy = Math.round(y + (size - cell * n) / 2);
    c.fillStyle = light; c.fillRect(x, y, size, size); c.fillStyle = dark;
    for (let rr_ = 0; rr_ < n; rr_++) for (let cc = 0; cc < n; cc++) if (q.isDark(rr_, cc)) c.fillRect(ox + cc * cell, oy + rr_ * cell, cell, cell);
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
  const link = "https://n3wyorkers.com/mlowtar#q=" + encodeURIComponent((res.question || "").slice(0, 60)) + "&s=" + (res.seed >>> 0);
  const qs = h - 24, qx = x + w - qs - 12, qy = y + 12;           // the stamp: a white square the height of the card, drawn after the paper (renderTicket)
  c.fillStyle = "#5a4a20"; setFont(c, "500 12px 'IBM Plex Mono', monospace", "1px"); c.textAlign = "right"; c.fillText("SCAN TO REPLAY", qx - 14, y + 60); c.fillText(res.serial ? "TICKET " + String(res.serial).padStart(4, "0") : ("N3W-" + (res.seed >>> 0).toString(36).toUpperCase()).slice(0, 12), qx - 14, y + 82); c.textAlign = "left"; setFont(c, c.font);
  return { link, qx, qy, qs };
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
      const ar = th.width / th.height, bw = W - 160, maxH = res.answer ? 330 : 400; let w = bw, h = w / ar; if (h > maxH) { h = maxH; w = h * ar; }
      const ix = 80 + (bw - w) / 2; c.save(); c.shadowColor = "rgba(0,0,0,.22)"; c.shadowBlur = 16; c.shadowOffsetY = 6; rr(c, ix, y + 24, w, h, 8); c.fillStyle = "#000"; c.fill(); c.restore();
      c.save(); rr(c, ix, y + 24, w, h, 8); c.clip(); c.drawImage(th, ix, y + 24, w, h); c.restore(); y += h + 44;
    } else y += 24;
    c.fillStyle = dark ? GOLD : EYE; setFont(c, "700 50px Fraunces, Georgia, serif", "-1px"); c.fillText("No. " + res.card.id, 80, y + 36);
    c.fillStyle = ink; setFont(c, "500 34px Fraunces, Georgia, serif"); const ny = wrapText(c, res.card.title, 80, y + 86, W - 160, 40, 2);
    c.fillStyle = dim; setFont(c, "500 20px 'Space Grotesk', sans-serif"); c.fillText([res.card.family, res.card.neighborhood || res.card.borough].filter(Boolean).join("  ·  "), 80, ny + 10);
    y = ny + 50;
  } else y += 40;
  // the answer, when the booth had one, is what the ticket keeps; the omen otherwise
  if (res.answer && res.answer.head) { c.fillStyle = dim; setFont(c, "700 16px 'IBM Plex Mono', monospace", "3px"); c.fillText("THE ANSWER", 80, y + 8); setFont(c, c.font); y += 12; }
  c.fillStyle = dark ? SKY : EYE; setFont(c, "500 38px Fraunces, Georgia, serif");
  const oy = wrapText(c, res.answer && res.answer.head ? res.answer.head : res.omen, 80, y + 44, W - 160, 48, 4); y = oy + 18;
  c.fillStyle = dim; setFont(c, "700 16px 'IBM Plex Mono', monospace", "3px"); c.fillText("THE ROOM FOR YOU", 80, y + 8);
  c.fillStyle = ink; setFont(c, "500 40px Fraunces, Georgia, serif", "-0.5px"); c.fillText(res.room ? res.room.name : "The museum", 80, y + 56);
  c.fillStyle = dim; setFont(c, "500 16px 'IBM Plex Mono', monospace", "2px"); c.fillText((res.room && res.room.area || "").toUpperCase(), 80, y + 88); setFont(c, c.font);
  // the MetroCard
  const ly = Math.min(y + 128, H - 556); const stamp = metroCard(c, 80, ly, W - 160, 236, res, ink);
  // the footer: a lockup from the brand set, the address, the closer, the awning
  const fy = Math.max(ly + 262, H - 300);
  if (logo) { c.save(); if (dark) { c.fillStyle = PAPER; rr(c, 80, fy - 6, 118, 118, 10); c.fill(); } c.globalCompositeOperation = "multiply"; c.drawImage(logo, 84, fy - 2, 110, 110); c.restore(); }
  c.textAlign = "left"; c.fillStyle = ink; setFont(c, "900 32px Fraunces, Georgia, serif", "-0.5px"); c.fillText("N3W YORKERS", logo ? 216 : 80, fy + 30);
  c.fillStyle = dim; setFont(c, "500 15px 'IBM Plex Mono', monospace", "2px"); c.fillText("N3WYORKERS.COM/MLOWTAR  ·  ART, NOT AN INVESTMENT", logo ? 216 : 80, fy + 58);
  setFont(c, "italic 500 21px Fraunces, Georgia, serif"); wrapText(c, res.closer || "", logo ? 216 : 80, fy + 90, W - (logo ? 296 : 160), 26, 2);
  awning(c, 0, H - 134, W, 40);
  // the paper, last: a CC0 scan (ambientCG Paper001) multiplied over everything so the ticket reads as a thing
  if (paperTex) { c.save(); c.globalCompositeOperation = dark ? "soft-light" : "multiply"; c.globalAlpha = dark ? 0.5 : 0.85; c.drawImage(paperTex, 0, 0, W, H); c.restore(); }
  // the QR last, over the paper, black on white: the one part of the ticket that has to be read by a machine
  if (stamp) { c.save(); c.shadowColor = "rgba(0,0,0,.18)"; c.shadowBlur = 10; c.shadowOffsetY = 3; c.fillStyle = "#fff"; rr(c, stamp.qx, stamp.qy, stamp.qs, stamp.qs, 8); c.fill(); c.restore();
    if (drawQR(c, stamp.link, stamp.qx, stamp.qy, stamp.qs, "#000", "#fff")) cv._qr = { x: stamp.qx, y: stamp.qy, s: stamp.qs, link: stamp.link };
    else barcode(c, RNG(res.seed >>> 0), stamp.qx + 10, stamp.qy + stamp.qs / 2 - 35, stamp.qs - 20, 70, "#1b1b1b"); }
  return cv;
}
export const ticketAspect = W / H;
export { drawQR };   // the lightbox draws the replay QR on its own panel at device pixels
/* the glyph set, exported for the glyph sheet (scratchpad glyph_sheet.html); nothing on the site imports it */
export const __G = G;
