/* MLOWTAR, the matcher. One file, two runtimes: the browser imports it from assets/mlowtar/, and
 * build_mlowtar.py copies it to _build/api/functions/api/_lib/mlowtar_match.js for the Function.
 * Keep it dependency free and side effect free.
 *
 * Deck rows (assets/mlowtar/deck.js): [id, title, family, borough, neighborhood, era, thumbKey, hook]
 * Rooms: api/rooms.json objects (id, name, area, place, mood, description, keywords, learn, fact...).
 */

export const STOP = new Set(("a an and are as at be but by for from has have he her his i if in into is it its me my of on or our " +
  "she so that the their them then there these they this to was we were what when where which who will with you your " +
  "am do does did not can could should would about just like really very get got going go want know think tell say " +
  "mlowtar booth fortune please ask question").split(" "));

export function tokens(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/)
    .map(w => w.replace(/^'+|'+$/g, "")).filter(w => w.length > 2 && !STOP.has(w));
}

/* Themes a question can carry. Each has the words that trigger it and the kind of room that answers it. */
export const THEMES = {
  love:   { words: "love crush date dating heart kiss boyfriend girlfriend partner wife husband ex marry marriage romance lonely alone soulmate text back".split(" "),
            rooms: "bridge pier park moon river roof promenade garden carousel rink fountain lights night".split(" ") },
  money:  { words: "money rent broke rich cash pay paid raise salary bills debt bag invest crypto eth token mint price buy sell wallet coin".split(" "),
            rooms: "wall street exchange bank diamond broker market stock gold vault trading".split(" ") },
  work:   { words: "job work boss career interview fired quit promotion office hustle grind startup client deadline meeting".split(" "),
            rooms: "office tower floor desk factory firehouse newsroom studio kitchen printing press workshop".split(" ") },
  home:   { words: "apartment home lease landlord roommate move moving neighborhood block building stoop sublet lease studio".split(" "),
            rooms: "tenement brownstone stoop block courtyard rooftop housing avenue street walk up".split(" ") },
  move:   { words: "train subway late commute delay bus taxi cab ride walk traffic ferry airport flight travel trip leave leaving".split(" "),
            rooms: "subway station platform terminal ferry tunnel bridge el track rail airport harbor".split(" ") },
  food:   { words: "eat food hungry dinner lunch pizza bagel bodega coffee deli slice dumpling noodle restaurant drink bar beer wine".split(" "),
            rooms: "deli bodega kitchen diner market pizza bakery fish counter bar tavern feast".split(" ") },
  art:    { words: "art artist paint painting draw drawing music song band write writing book poem design studio create creative gallery museum show".split(" "),
            rooms: "museum gallery studio theater stage hall club music painting print record".split(" ") },
  luck:   { words: "luck lucky number win winning lottery bet odds chance gamble fate destiny year".split(" "),
            rooms: "coney wonder wheel boardwalk arcade carnival casino racetrack stadium".split(" ") },
  lost:   { words: "lost losing lose miss missing gone grief grieving dead died death passed goodbye funeral forget forgot remember memory".split(" "),
            rooms: "memorial cemetery church cathedral chapel reading library garden harbor quiet".split(" ") },
  night:  { words: "night party club dance dancing drunk late out tonight sleep tired insomnia dream dreams".split(" "),
            rooms: "club disco night bar neon after hours garage ballroom roof".split(" ") },
  family: { words: "mom mother dad father kid kids child children son daughter brother sister family grandma grandpa parents baby".split(" "),
            rooms: "playground school park zoo carousel kitchen stoop church block".split(" ") },
  fame:   { words: "famous fame viral followers post tweet followers celebrity star stage audition act actor model known seen".split(" "),
            rooms: "theater stage broadway studio garden arena square marquee radio".split(" ") },
  city:   { words: "city york nyc manhattan brooklyn queens bronx staten island borough uptown downtown harlem bushwick williamsburg astoria".split(" "),
            rooms: "".split(" ") },
  future: { words: "future will happen next year plan plans change decision choose choice should".split(" "),
            rooms: "world fair unisphere tower observatory horizon skyline bridge".split(" ") },
};

export function themeOf(text) {
  const t = tokens(text); const score = {};
  for (const [k, th] of Object.entries(THEMES)) {
    let s = 0; for (const w of t) if (th.words.includes(w)) s += (k === "city" ? 0.5 : k === "lost" || k === "family" ? 1.5 : 1);
    if (s) score[k] = s;
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : "wander";
}

/* small, fast, deterministic */
export function hash(str) { let h = 2166136261 >>> 0; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const roomText = r => [r.name, r.area, r.place, r.mood, r.description, r.learn, (r.keywords || []).join(" ")].join(" ").toLowerCase();

/* Score a room against the question (its words), the theme (its room words) and the drawn New Yorker
 * (their neighborhood and borough: the booth sends you where your card lives when nothing else speaks). */
export function scoreRoom(room, toks, theme, card) {
  const txt = roomText(room); let s = 0;
  for (const w of toks) if (txt.includes(w)) s += w.length > 5 ? 3 : 2;
  const th = THEMES[theme]; if (th) for (const w of th.rooms) if (w && txt.includes(w)) s += 1.5;
  if (card) {
    const nb = String(card[4] || "").toLowerCase(), bo = String(card[3] || "").toLowerCase().replace(/\s*\(.*$/, "");
    if (nb && nb.length > 3 && txt.includes(nb)) s += 4;
    if (bo && bo !== "citywide" && txt.includes(bo)) s += 1;
  }
  return s;
}

export function pickRoom(rooms, text, theme, card, seed) {
  const toks = tokens(text), r = rng(seed ^ 0x9e3779b9);
  const scored = rooms.map(room => ({ room, s: scoreRoom(room, toks, theme, card) + r() * 0.9 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].room;
}

/* The card. Words in the question that match a New Yorker's title, family, neighborhood or hook pull them
 * forward; the whole deck is scored and the card is dealt, seeded, from the top tier rather than the single
 * best hit, so the same question deals a different New Yorker every time (there are thousands). With no
 * words to match the deck is simply shuffled by the seed. */
export function pickCard(deck, text, seed, exclude) {
  const toks = tokens(text), r = rng(seed);
  if (!deck.length) return null;
  const ex = new Set(exclude || []);
  if (toks.length) {
    const hits = [];
    for (const row of deck) {
      if (ex.has(row[0])) continue;
      const hay = (row[1] + " " + row[2] + " " + row[4] + " " + row[7]).toLowerCase(); let s = 0;
      for (const w of toks) if (hay.includes(w)) s += w.length > 5 ? 3 : 2;
      if (s >= 2) hits.push([s, row]);
    }
    if (hits.length) {
      hits.sort((a, b) => b[0] - a[0]);
      const top = hits[0][0], tier = hits.filter(h => h[0] >= top - 2);           // the best hits and the near misses
      const pool = tier.length >= 12 ? tier : hits.slice(0, Math.min(hits.length, Math.max(12, Math.ceil(hits.length * 0.25))));
      while (pool.length < 12) { const row = deck[Math.floor(r() * deck.length)]; if (!ex.has(row[0]) && !pool.some(h => h[1] === row)) pool.push([0, row]); }   // a thin match never pins one card
      return pool[Math.floor(r() * pool.length)][1];
    }
  }
  for (let i = 0; i < 20; i++) { const row = deck[Math.floor(r() * deck.length)]; if (!ex.has(row[0])) return row; }
  return deck[0];
}

export const TRAINS = ["1", "4", "7", "A", "B", "G", "J", "L", "N"];
