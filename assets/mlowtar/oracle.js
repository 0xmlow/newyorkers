/* MLOWTAR, the booth's own voice. Runs entirely in the browser with no key and no server: the census is
 * the deck, the museum is the map, and a seed (question plus the minute you asked) makes the same ask give
 * the same answer, so a shared link replays the reading. The same file runs in Node for the pre generated
 * set (_build/mlowtar_fortunes.mjs writes ten thousand of them for red teaming).
 *
 * The script is assembled from banks keyed by three things: the question's theme, the card dealt from the
 * census, and the visitor's FILE, five quick answers taken before the first ask (borough, hour, order, train,
 * what you're carrying). Greeting x file line x card lines x aside x omen x room x closer gives well over a
 * million distinct scripts; no two of the ten thousand pre generated ones repeat.
 *
 * Voice: a fairground oracle who has lived in New York too long to be mystical about it. The lines are
 * written the Jack Butcher way: the point first, short, you not I, a colon as the pivot, land on a noun.
 * Never mean, never a prediction about health or money (the census is art, not an investment), no dashes.
 */
import { tokens, themeOf, hash, rng, pickRoom, pickCard, TRAINS, scoreRoom } from "./match.js";

/* ---------- the file: five questions, answered once, kept in the browser ---------- */
export const FILE = [
  { k: "borough", q: "Where does the city keep you?", a: [["Manhattan", "MANHATTAN"], ["Brooklyn", "BROOKLYN"], ["Queens", "QUEENS"], ["The Bronx", "THE BRONX"], ["Staten Island", "STATEN ISLAND"], ["Just visiting", "VISITING"]] },
  { k: "hour", q: "Pick the hour that belongs to you.", a: [["6:12 AM", "DAWN SHIFT"], ["Noon, outside", "HIGH NOON"], ["Golden hour on the bridge", "GOLDEN HOUR"], ["11:40 PM", "LAST SET"], ["3 AM, awake anyway", "THE 3 AM"]] },
  { k: "order", q: "Your order, no thinking.", a: [["Everything bagel, scallion", "THE BAGEL"], ["A plain slice, folded", "THE SLICE"], ["Twelve dumplings", "THE DUMPLINGS"], ["Coffee, black, blue cup", "THE COFFEE"], ["The halal cart, white sauce", "THE CART"]] },
  { k: "train", q: "Your train.", a: TRAINS.map(t => [t, "THE " + t]) },
  { k: "carry", q: "What are you carrying in?", a: [["A worry", "A WORRY"], ["A wish", "A WISH"], ["A grudge", "A GRUDGE"], ["A plan", "A PLAN"], ["Nothing, which is the problem", "NOTHING"]] },
];

const GREET = {
  any: ["The booth hums. The eye opens. You're letting the cold in", "MLOWTAR sees you. MLOWTAR saw you three blocks ago", "The glass fogs, then clears. The city has an opinion about you", "Ah. You again, or someone exactly like you. The census is big", "Hands on the glass. Not like that. Fine, like that", "The ball goes milky, then goes Brooklyn", "Quiet. The crystal picks up the 4 train. Give it a second", "MLOWTAR charges nothing. MLOWTAR is paid in questions. Yours is a good one", "The flower turns to you the way a sunflower turns to a bodega light", "Lean in. The booth is old, the city is older, both are listening", "The eye blinks once. Once means proceed", "You asked the booth, not the pigeon. Already ahead"],
  "DAWN SHIFT": ["Up before the bakers. The booth respects that", "6:12. The city is yours for forty minutes. Spend one here"],
  "HIGH NOON": ["Noon, outside, no shade. The honest hour", "You asked in daylight. Brave. Most people wait for the dark"],
  "GOLDEN HOUR": ["Golden hour on the bridge: the city's best lie. The booth tells the rest", "The light that makes everyone look like a New Yorker. Including you"],
  "LAST SET": ["11:40. One more set, one more question", "The last set is where the band tells the truth. Same here"],
  "THE 3 AM": ["3 AM. The booth keeps your hours", "Awake anyway. Good. The city answers faster at this hour"],
};
const FILE_LINE = [
  "{borough}, {hour}, {order}, the {train}: the booth has your type on file",
  "On file: {borough}, {hour}, {order}. Carrying {carry}. Noted",
  "{order} at {hour}. The {train}. {borough}. The ball knows exactly who you are",
  "A {borough} {hour} {order} person, carrying {carry}. The city has met you",
  "{carry} on the {train} at {hour}. {borough} ink all over this",
  "The file says {borough}, the {train}, {order}. The file is rarely wrong",
  "{hour}. {order}. {carry}. That is a whole borough in three words. {borough}, obviously",
  "Carrying {carry} through {borough} at {hour}: the booth has a slip for that",
];
const CARRY = {
  "A WORRY": ["The worry is smaller on the far side of the river. Cross it", "Worry is rent you pay on a place you don't live. Move out", "Put the worry down on the stoop. It'll be there when you get back, or it won't"],
  "A WISH": ["A wish is a plan without a MetroCard. Swipe", "Say the wish once, out loud, on a platform. Then it's filed", "Wishes in this city come true sideways. Watch the side streets"],
  "A GRUDGE": ["The grudge rides the local. You should take the express", "Keep the grudge if it keeps you warm. Drop it in April", "The person you're mad at just missed the same train. Even now"],
  "A PLAN": ["The plan survives first contact with the L. Barely", "Plans are maps. The city is weather", "Good plan. Add a bagel to it"],
  "NOTHING": ["Nothing is a full bag in this city. Everyone's carrying it", "Carrying nothing means you can run for the train. Run", "The booth loves nothing. Nothing is where the good answers start"],
};
const ORDER = {
  "THE BAGEL": ["An everything person asking a specific question. Rare", "Scallion on everything: you want it all, and you want it toasted"],
  "THE SLICE": ["Folded slice: you decided before you ordered. Keep deciding", "Plain slice people get plain answers. Here's yours anyway"],
  "THE DUMPLINGS": ["Twelve dumplings: you plan to share and you won't", "Dumplings at this hour means you know a place. You always know a place"],
  "THE COFFEE": ["Black coffee in the blue cup: the city's oldest contract", "Blue cup person. The booth trusts you with the answer"],
  "THE CART": ["White sauce, hot sauce, both: you contain multitudes", "The cart knows your name. So does the booth"],
};
const FAMILY = {
  Citizens:    ["A Citizen card: the city counts you on the days you'd rather it didn't", "Citizen. Ordinary the way the skyline is ordinary: not at all"],
  Builders:    ["A Builder turned up. Something wants a scaffold before a window", "Builders carry the city and complain the whole way. You'll be fine"],
  Degens:      ["A Degen. The ball wobbled when it dealt this one", "Degen card: not permission, recognition"],
  Underground: ["An Underground card. The answer is below street level, warmer than they say", "Underground. Things move in the dark down there, mostly on time"],
  Design:      ["A Design card: the shape is right, the finish is nagging you", "Design. Fix the kerning of your week and the rest follows"],
  Stoop:       ["A Stoop card. What you're chasing walks past your steps if you sit long enough", "The Stoop: half the city's decisions, one cold drink, no rush"],
  Hustlers:    ["Hustler card. You know the move. You want someone to say go. Go", "A Hustler. The city respects the grind and ignores the complaint"],
  Heroes:      ["A Hero. Sounds flattering until you remember what heroes put up with", "Hero card. Someone needs you this week. You'll call it nothing"],
  Villains:    ["A Villain card. Not you. The thing in your way. Villains lose here, slowly, then all at once", "The census dealt a Villain. Every New Yorker gets a portrait, even the ones who deserve a wanted poster"],
  Transplants: ["A Transplant: you arrived with a plan and the city rewrote it. The rewrite is better", "Transplant. Nobody was born knowing which end of the platform. You learned"],
  Process:     ["Process card. The ball shows the middle, not the end. Stay in the middle", "A Process card. Not done is different from not working"],
  Strays:      ["A Stray. The best New Yorkers were never officially let in. They stayed", "Stray card. You belong somewhere you haven't walked into yet"],
  Places:      ["A Place, not a person. The city tells you where before it tells you who", "A Place card. Go stand in it. Answers here are geographic"],
};
const BOROUGH = {
  "Manhattan": "Manhattan ink: the answer arrives fast and expensive",
  "Brooklyn": "Brooklyn on the card: the answer takes the long way and brings a friend",
  "Queens": "Queens on the card: more languages than you asked in, all of them yes",
  "Bronx": "The Bronx on the card: roots and a beat",
  "Staten Island": "Staten Island on the card: the ferry, a free view, think it over on the water",
  "Citywide": "Citywide ink, no borough. It follows you everywhere. Stop running",
};
const OMEN = {
  love:   ["The door you almost skipped: someone holding it", "The text comes back late and from the wrong number", "Love in this city is logistics. Pick a borough", "Someone on the train is looking. It isn't weird. Let it be", "Whoever you're asking about asked a booth tonight. Same answer", "Two people can be lonely on the same bench. Sit closer"],
  money:  ["No financial advice from a booth. The census is art, not an investment", "Rent gets paid the New York way: panic, miracle, receipt", "The thing you own that's worth most: a friend", "Money in a coat pocket this week. Enough for a slice", "The bag is in your other hand", "Broke in New York is still New York. Count that"],
  work:   ["The meeting you fear is shorter than the one you dread", "Quit nothing this week. Finish one thing", "Your boss asked a booth too. It said yes", "The job you want is two emails away. One is to yourself", "Sideways on Tuesday, upright by Thursday. Hold the rail", "Work that nobody sees is the work the city runs on"],
  home:   ["The apartment exists. It has one weird closet. You'll love the closet", "Stay on the block. The reason to leave opens across the street", "A neighbor you've never met solves a problem you never mentioned", "The deposit comes back. The ball shook, but it said it", "Home is where the delivery guy knows the buzzer", "Fifth floor walk up: the rent is the stairs"],
  move:   ["Not the train you wanted. The train you needed", "Walk it. What you're late for will wait. The walk won't", "Transfer where the map says don't. The map has never been in love", "A delay puts the right stranger next to you. Headphones out", "Leave ten minutes early and the week rearranges itself", "The express skips your stop for a reason. Find out which"],
  food:   ["Order what the person in front of you ordered. They know", "A bagel settles this. A bagel settles most things", "The deli that closed reopens as the same deli. Go opening day", "Eat standing up once this week. Decisions taste different", "Best meal of the month: under twelve dollars, free opinion included", "The counterman remembers you. Live up to it"],
  art:    ["Make the ugly version first. The city did", "Someone sees the work and says nothing. Highest compliment in town", "Finish it. Hang it crooked. Fix it tomorrow", "The idea you're embarrassed by is the one the room remembers", "Every New Yorker gets a portrait, even the villains. Yours is going well", "Studio rent is the only critic that matters. Pay it with work"],
  luck:   ["Your luck is the number on this card. Play nothing. Notice it", "One good parking spot this month. Spend it well", "The coin lands on its edge: a yes with conditions", "Luck is a corner, not a day. Yours has the slow light", "Today mild. Tomorrow suspiciously good. Carry the umbrella", "Lucky people leave early. That's the whole trick"],
  lost:   ["The city keeps everything. It surfaces when you stop checking the obvious drawer", "Grief walks. River to river, lighter by the avenue", "A stranger says their name this week. Take it as hello", "The booth can't bring it back. The booth can say it was counted. It was counted", "Loss leaves a chair out. Someone new sits down. That's allowed", "What you lost on the train is riding the whole line looking for you"],
  night:  ["Go out. Be home before the trains thin. The rest is the same night, repeated", "The party is good until 1:40. The ball is precise", "Sleep is stuck behind a garbage truck on your block. Twenty minutes", "Dance once this week where nobody knows your job", "The night has a door you haven't tried. Same color as the wall", "After hours the city tells the truth at a discount"],
  family: ["Call them. They're about to call you. Be first", "Family is a borough: loud, overlapping, impossible to leave", "A kid explains your whole situation this week in one sentence", "The recipe is under the takeout menus. It always was", "Someone older is proud and won't say it. The booth just did", "Sunday dinner is the only meeting that was ever on time"],
  fame:   ["Recognized by one person this week. One is the right number", "The post does fine. The thing you don't post does better", "Fame here lasts a block and a half. Make it a good block", "Someone films you doing something ordinary. Do it well", "Stage fright is the city checking you're awake", "Eight million people and one of them is clapping. Find them"],
  city:   ["The borough you named heard you and is slightly offended you asked", "Cross the bridge the other way. Different answer, same river", "The city owes you nothing, so everything it gives counts double", "Your neighborhood has a secret. It's a staircase", "Go where the tourists aren't, then look at what they'd have loved", "Every block is a village that pretends it isn't"],
  future: ["The decision is made. You're waiting on paperwork. The paperwork is you", "Next year has a room you haven't seen. The door is below", "Pick the option that makes a good stoop story. That's the whole method", "The plan survives week one and dies in week two. Plan for week two", "Change arrives like a new deli sign: overnight, then it was always there", "What's next is already on the platform. You're facing the wrong way"],
  wander: ["No question, so every answer: yes, soon, bring a jacket", "Two avenues east of here, something has your name on it", "The ball shows a light changing and you not running for it. Good", "Someone says good morning this week and means it. Return it exactly", "The eye flower blooms when there's nothing to warn you about. It's blooming", "Walk until the street numbers stop making sense. Start there"],
};
const CLOSER = ["The booth has spoken. Tips in the slot, questions in the eye", "That's the reading. The city reserves the right to improvise", "Come back when the moon is over Brooklyn Heights. The ball is clearer then", "MLOWTAR is never wrong. MLOWTAR is sometimes early", "Say it out loud on a platform and it becomes binding", "Go. The room is waiting and the light is good right now", "The eye closes. The hum drops. Something in the booth reshuffles for the next one", "Take the ticket. Lose it. Find it in a coat in March", "Next", "The city will confirm by text. It won't. Go anyway"];
const ROOM_WHY = { love: "Where the city goes to be looked at properly", money: "Where New York keeps its ledger. Look, don't touch", work: "A place that works for a living. Watch how it carries itself", home: "The kind of block where the answer lives on the stoop", move: "Go where the city moves. Stand still in it for a minute", food: "Follow the counter. The booth never sends anyone hungry", art: "Go where somebody made something and left it there for you", luck: "A place where luck has been tested in public for a century", lost: "Somewhere quiet enough to hear what you're missing", night: "Your room for after hours. Mind the step", family: "A room with room in it for everybody you dragged along", fame: "Where the city practices being looked at", city: "The borough on your card asked for you by name", future: "A place built to look forward. Stand on the edge of it", wander: "Your card lives near here. Go say hello" };
const TAG = f => f && f.length ? f : "";

export function makeSeed(q, salt) { return hash((q || "").trim().toLowerCase() + "|" + (salt == null ? Math.floor(Date.now() / 60000) : salt)); }

/* the whole reading, deterministic from (question, seed, file). deck and rooms are the loaded data. */
export function read(q, seed, deck, rooms, opts) {
  opts = opts || {}; const file = opts.file || {};
  const r = rng(seed), theme = themeOf(q), pick = arr => arr[Math.floor(r() * arr.length)];
  const fileSeed = hash(JSON.stringify(file));
  // the borough on file leans the card draw and the room pick; the train on file is the lucky train
  const boroughWant = { MANHATTAN: "Manhattan", BROOKLYN: "Brooklyn", QUEENS: "Queens", "THE BRONX": "Bronx", "STATEN ISLAND": "Staten Island" }[file.borough] || null;
  let card = pickCard(deck, q, seed ^ fileSeed, opts.exclude);
  if (boroughWant && card && !String(card[3]).startsWith(boroughWant) && r() < 0.55) {
    const alt = pickCard(deck.filter(d => String(d[3]).startsWith(boroughWant)), q, seed ^ 0x51ed, opts.exclude); if (alt) card = alt;
  }
  let room = pickRoom(rooms, q + (boroughWant ? " " + boroughWant : ""), theme, card, seed ^ fileSeed);
  const fam = FAMILY[card && card[2]] || FAMILY.Citizens, bo = card ? String(card[3] || "").replace(/\s*\(.*$/, "") : "";
  const greetBank = (file.hour && GREET[file.hour] && r() < 0.45) ? GREET[file.hour] : GREET.any;
  const reading = [`The census turns up No. ${card ? card[0] : "?"}, ${card ? card[1] : "a New Yorker"}${card && card[4] ? ", " + card[4] : ""}`, pick(fam)];
  if (BOROUGH[bo]) reading.push(BOROUGH[bo]);
  if (card && card[7]) { const h = card[7].replace(/\s+$/, ""); reading.push(`On the card: "${h}${/[.!?…]$/.test(h) ? "" : "."}"`); }
  const haveFile = file.borough && file.hour && file.order && file.train && file.carry;
  const fileLine = haveFile ? pick(FILE_LINE).replace("{borough}", file.borough === "VISITING" ? "visiting" : titleCase(file.borough)).replace("{hour}", hourWord(file.hour)).replace("{order}", orderWord(file.order)).replace("{train}", file.train.replace("THE ", "")).replace("{carry}", file.carry.toLowerCase()) : null;
  const aside = haveFile ? (r() < 0.5 ? pick(CARRY[file.carry] || CARRY["A PLAN"]) : pick(ORDER[file.order] || ORDER["THE COFFEE"])) : null;
  const omen = pick(OMEN[theme] || OMEN.wander);
  const train = (file.train && TRAINS.includes(file.train.replace("THE ", ""))) ? file.train.replace("THE ", "") : TRAINS[seed % TRAINS.length];
  return {
    mode: "booth", theme, seed, question: q,
    greet: pick(greetBank), fileLine, reading, aside, omen, closer: pick(CLOSER),
    card: card ? { id: card[0], title: card[1], family: card[2], borough: card[3], neighborhood: card[4], era: card[5], thumb: card[6], hook: card[7] } : null,
    room: room ? { id: room.id, name: room.name, area: room.area, mood: room.mood, learn: room.learn, image: room.image, why: ROOM_WHY[theme] || ROOM_WHY.wander } : null,
    lucky: { number: card ? Number(card[0]) : 0, train },
    file: haveFile ? { borough: file.borough, hour: file.hour, order: file.order, train: file.train, carry: file.carry } : null,
  };
}
/* everything the booth says, in order: what the voice reads and the recorder captions */
export function script(res) {
  return [res.greet, res.fileLine, ...res.reading, res.aside, res.omen, res.room ? `Go to ${res.room.name}. ${res.room.why}` : "", `Lucky train, the ${res.lucky.train}. Lucky number, ${res.lucky.number}`, res.closer].filter(Boolean);
}
const titleCase = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const hourWord = h => ({ "DAWN SHIFT": "dawn", "HIGH NOON": "noon", "GOLDEN HOUR": "golden hour", "LAST SET": "11:40", "THE 3 AM": "3 AM" }[h] || h.toLowerCase());
const orderWord = o => ({ "THE BAGEL": "everything bagel", "THE SLICE": "plain slice", "THE DUMPLINGS": "twelve dumplings", "THE COFFEE": "black coffee", "THE CART": "the cart" }[o] || o.toLowerCase());

export const STARTERS = ["Will I find an apartment I can afford?", "Should I take the job?", "Does he text back?", "Where should I eat tonight?", "Is it my year?", "What does the city want from me?", "Which train is my train?", "I lost something on the L.", "Should I move to Queens?", "Will the Knicks break my heart again?", "Is the bodega cat judging me?", "Do I stay or do I go?"];
export { tokens, themeOf, hash, rng };
