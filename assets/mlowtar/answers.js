/* MLOWTAR, the answer. Before 2026-10-17 the booth never answered the question: it dealt a card and
 * stitched mystic lines around it, so "where do I move in January" got a garden and "where do I get
 * robbed" got a scaffolder. MLow: "kinda hard to understand wtf its talking about". This file is the fix.
 *
 * answer(q, seed, opts) works out what was asked (where to live, safety, where to eat, what to do, the
 * weather, getting to the airport, this or that, should I) and the constraints inside it (borough, month or
 * season, budget, what the person wants), and returns a plain answer first: a headline the booth says out
 * loud, then two to four specific lines. The card, the room and the omen hang off it afterwards.
 * Returns null when the question is not one the city can answer (the booth then reads it the old way).
 *
 * Facts are written to be true as of October 2026 and kept general where they go stale (rents are a
 * ballpark, places are institutions). Same voice rules as oracle.js: no dashes, no arrows, short lines.
 * Runs in the browser and in Node (mlowtar_fortunes.mjs), no imports beyond match.js.
 */
import { rng, hash } from "./match.js";

/* ---------- the neighborhoods ----------
 * [name, borough, rough 1 bedroom rent, trains, tags, winter (1 to 3: how easy the place is in February:
 * subway at the door, elevator buildings, everything on the block), the honest line]
 * tags: quiet night food young family park cheap luxe art water midtown downtown brownstone diverse lgbt */
export const HOODS = [
  ["Yorkville", "Manhattan", 3500, "Q 4 5 6", "quiet young family park midtown", 3, "the cheapest real Manhattan below 96th, the Second Avenue Subway at the door, walk ups and doorman towers on the same block"],
  ["the Upper East Side", "Manhattan", 4200, "Q 4 5 6", "quiet family park luxe midtown", 3, "doormen, the Met, Central Park, and laundry in the basement"],
  ["the Upper West Side", "Manhattan", 4300, "1 2 3 B C", "quiet family park food", 2, "two parks, the 1 2 3 express, and a bagel on every block"],
  ["Morningside Heights", "Manhattan", 3200, "1 B C", "quiet young art park", 2, "the college neighborhood, cheaper than the UWS and twelve minutes further"],
  ["Harlem", "Manhattan", 2900, "2 3 A B C D", "food night art diverse brownstone", 2, "brownstones, the A express to Midtown in fifteen minutes, and the best food row in Manhattan"],
  ["Hamilton Heights", "Manhattan", 2600, "1 A B C D", "quiet cheap brownstone", 2, "Sugar Hill brownstones and the A express, priced like it is still 2015"],
  ["Washington Heights", "Manhattan", 2500, "A C 1", "cheap food diverse park", 2, "real space for the money, Dominican food, the A express straight down the island"],
  ["Hudson Heights", "Manhattan", 2600, "A", "quiet park cheap", 2, "prewar elevator buildings next to Fort Tryon Park, and the A express"],
  ["Inwood", "Manhattan", 2300, "A 1", "cheap park quiet", 1, "the last affordable corner of Manhattan, with an actual forest, at the end of the line"],
  ["East Harlem", "Manhattan", 2700, "4 5 6 Q", "food cheap diverse", 2, "the Q now reaches it, the 4 5 express is right there, and the rent still makes sense"],
  ["Murray Hill", "Manhattan", 4000, "4 5 6 7 S", "young night midtown", 3, "walk to Grand Central, doorman buildings everywhere, the post college capital"],
  ["Kips Bay", "Manhattan", 3900, "6", "quiet midtown", 3, "quiet doorman blocks, a walk to Midtown, nothing anyone writes songs about"],
  ["Gramercy", "Manhattan", 4700, "4 5 6 L N Q R W", "quiet luxe", 3, "the calmest blocks below 23rd, Union Square trains a walk away"],
  ["Midtown East", "Manhattan", 4000, "E M 4 5 6 7", "quiet midtown", 3, "a ten minute walk to most offices, big buildings with gyms and laundry"],
  ["Hell's Kitchen", "Manhattan", 4300, "A C E 1 2 3 7", "night food lgbt midtown", 3, "restaurant row, every train at 42nd, and a bar that is open"],
  ["Chelsea", "Manhattan", 5000, "A C E 1 L", "art lgbt night", 3, "galleries, the High Line, Chelsea Market, and you pay for all three"],
  ["the West Village", "Manhattan", 5600, "1 A C E B D F M L", "food night luxe", 2, "the prettiest blocks in the city and the smallest kitchens"],
  ["the East Village", "Manhattan", 4300, "L 6 F", "night food young", 2, "every kind of bar and restaurant in ten blocks; past Avenue A the subway is a hike"],
  ["the Lower East Side", "Manhattan", 4100, "F J M Z", "night food young", 2, "Katz's, Russ and Daughters and a hundred bars, louder on Fridays than you think"],
  ["Chinatown", "Manhattan", 3400, "B D F J Z N Q R 6", "food cheap", 3, "the best cheap food in Manhattan and every train on Canal"],
  ["the Financial District", "Manhattan", 4400, "2 3 4 5 A C J Z R W 1 E", "downtown quiet", 3, "dead on weekends, but the laundry is in the building, the gym is in the basement, and Fulton Street has twelve lines"],
  ["Battery Park City", "Manhattan", 5000, "1 R W E", "quiet family water park", 1, "the river, the parks, the quiet; a long walk to the train in sleet"],
  ["Tribeca", "Manhattan", 7500, "1 A C E", "luxe family quiet", 2, "lofts and money"],
  ["SoHo", "Manhattan", 6200, "C E N R W 6", "luxe art", 2, "cast iron lofts above a shopping mall"],
  ["Stuyvesant Town", "Manhattan", 4200, "L", "quiet park family", 2, "a gated village of brick towers, lawns and heat that actually works"],
  ["Roosevelt Island", "Manhattan", 3400, "F", "quiet water family", 1, "the tram, the river and silence; one train, the F"],
  ["Williamsburg", "Brooklyn", 4300, "L J M Z G", "night food young art water", 2, "the full Brooklyn experience, one stop from Manhattan on the L"],
  ["Greenpoint", "Brooklyn", 3800, "G", "quiet food water", 1, "Polish bakeries, the waterfront, and the G, which is the catch"],
  ["Bushwick", "Brooklyn", 3000, "L J M", "night art young cheap", 2, "warehouses, murals, the parties, and the L"],
  ["Bed-Stuy", "Brooklyn", 2900, "A C J M Z G", "brownstone food diverse", 2, "brownstone blocks with a real neighborhood on the stoop and the A express"],
  ["Crown Heights", "Brooklyn", 2700, "2 3 4 5 A C S", "food diverse cheap", 2, "the 2 3 4 5 express, Caribbean food, and the Brooklyn Museum up the road"],
  ["Prospect Lefferts Gardens", "Brooklyn", 2500, "B Q 2 5", "quiet park cheap", 2, "the quiet side of Prospect Park for a lot less than the Slope"],
  ["Park Slope", "Brooklyn", 3800, "F G R 2 3 B Q", "family park quiet brownstone", 2, "Prospect Park, brownstones and strollers, for a reason"],
  ["Fort Greene", "Brooklyn", 3900, "C G B D N Q R 2 3 4 5", "park food art", 3, "a beautiful park, BAM, and Atlantic Terminal, where nine lines meet"],
  ["Clinton Hill", "Brooklyn", 3500, "C G", "art quiet brownstone", 2, "mansions, Pratt, and the C"],
  ["Prospect Heights", "Brooklyn", 3900, "2 3 B Q S", "food art park", 3, "the Botanic Garden, the Brooklyn Museum and Vanderbilt Avenue, all walkable"],
  ["Carroll Gardens", "Brooklyn", 4000, "F G", "food quiet family brownstone", 2, "deep front gardens, Court Street, red sauce, the F"],
  ["Brooklyn Heights", "Brooklyn", 4300, "2 3 4 5 A C R", "quiet water downtown", 3, "the Promenade, the quietest blocks in Brooklyn, one stop to Wall Street"],
  ["DUMBO", "Brooklyn", 5200, "F A C", "water luxe", 2, "the bridge in your window and the price to match"],
  ["Downtown Brooklyn", "Brooklyn", 4000, "2 3 4 5 A C F R B D N Q", "downtown young", 3, "new towers with gyms, laundry and every train in Brooklyn"],
  ["Sunset Park", "Brooklyn", 2500, "D N R", "food cheap diverse", 2, "Brooklyn's Chinatown, taco row on Fifth, and a park with the whole skyline"],
  ["Bay Ridge", "Brooklyn", 2300, "R", "quiet water family cheap", 1, "the shore path under the Verrazzano and real apartments; the R is slow"],
  ["Ditmas Park", "Brooklyn", 2300, "B Q", "quiet cheap", 1, "Victorian houses with porches, the Q, and space"],
  ["Flatbush", "Brooklyn", 2300, "2 5 B Q", "cheap food diverse", 2, "the 2 and the Q, Caribbean bakeries, and room"],
  ["Astoria", "Queens", 2800, "N W", "food night young", 2, "Greek tavernas, the beer garden, the N to Midtown in twenty minutes"],
  ["Long Island City", "Queens", 4000, "7 E M G N W", "midtown water", 3, "one stop to Manhattan, glass towers with gyms and laundry, the skyline as your screensaver"],
  ["Sunnyside", "Queens", 2400, "7", "quiet cheap family", 2, "garden apartments, the 7, and a quiet that Manhattan forgot"],
  ["Jackson Heights", "Queens", 2300, "7 E F M R", "food diverse cheap lgbt", 3, "the best food in the city by miles, express trains, co op garden buildings"],
  ["Ridgewood", "Queens", 2600, "M L", "cheap young art quiet", 2, "Bushwick's calmer neighbor, brick row houses, the M and L"],
  ["Forest Hills", "Queens", 2500, "E F M R", "quiet family park", 2, "Tudor gardens, the E F express and the LIRR, twenty minutes to Penn"],
  ["Flushing", "Queens", 2300, "7", "food cheap", 2, "the biggest Chinatown in New York, at the end of the 7"],
  ["Woodside", "Queens", 2300, "7", "cheap food", 2, "the 7, the LIRR, Thai and Irish pubs on the same corner"],
  ["Riverdale", "Bronx", 2200, "1", "quiet park water", 1, "the Hudson, big trees, prewar co ops; the 1 or Metro North"],
  ["Mott Haven", "Bronx", 2600, "4 5 6", "cheap art midtown", 2, "new towers on the river, the 4 5 express, fifteen minutes to Grand Central"],
  ["Belmont", "Bronx", 1900, "B D", "food cheap", 1, "Arthur Avenue, the real Little Italy, and cheap rent"],
  ["St. George", "Staten Island", 2000, "SIR", "cheap water quiet", 1, "the free ferry and the view; gorgeous in June, rough in sleet"],
];
const BOROUGHS = { manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens", bronx: "Bronx", "staten island": "Staten Island" };
const ALIAS = { ues: "the Upper East Side", uws: "the Upper West Side", "upper east": "the Upper East Side", "upper west": "the Upper West Side", "east village": "the East Village", "west village": "the West Village",
  "greenwich village": "the West Village", "lower east": "the Lower East Side", les: "the Lower East Side", fidi: "the Financial District", "financial district": "the Financial District", "wall street": "the Financial District",
  lic: "Long Island City", "long island city": "Long Island City", "bed stuy": "Bed-Stuy", bedstuy: "Bed-Stuy", "bedford stuyvesant": "Bed-Stuy", "hells kitchen": "Hell's Kitchen", "hell's kitchen": "Hell's Kitchen",
  "stuy town": "Stuyvesant Town", stuytown: "Stuyvesant Town", "park slope": "Park Slope", "dumbo": "DUMBO", "midtown": "Midtown East", "pelham": null, "south bronx": "Mott Haven", "arthur avenue": "Belmont", "plg": "Prospect Lefferts Gardens" };
const norm = s => String(s || "").toLowerCase().replace(/(\d),(\d{3})/g, "$1$2").replace(/[’']/g, "'").replace(/[^a-z0-9$' ]+/g, " ").replace(/\s+/g, " ").trim();
const bare = n => n.replace(/^the /, "").toLowerCase();
function findHoods(t) {
  const out = [];
  for (const h of HOODS) if (new RegExp("\\b" + bare(h[0]).replace(/[-.]/g, "[ .-]?") + "\\b").test(t)) out.push(h);
  for (const [k, v] of Object.entries(ALIAS)) if (v && new RegExp("\\b" + k + "\\b").test(t)) { const h = HOODS.find(x => x[0] === v); if (h && !out.includes(h)) out.push(h); }
  return out;
}
function findBoroughs(t) { const out = []; for (const [k, v] of Object.entries(BOROUGHS)) if (new RegExp("\\b" + k + "\\b").test(t)) out.push(v); if (/\buptown\b/.test(t) && !out.includes("Manhattan")) out.push("Manhattan"); return out; }

/* ---------- time: the month the question is about, or now ---------- */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/* NYC normals, high and low in Fahrenheit */
const NORMALS = [[39, 27], [42, 29], [50, 35], [62, 45], [72, 54], [80, 64], [85, 70], [84, 69], [76, 62], [65, 51], [54, 42], [44, 33]];
function monthOf(t, now) {
  const m = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(uary|ruary|ch|il|e|y|ust|tember|ober|ember)?\b/);
  if (m && !(m[1] === "may" && !m[2] && /\b(i|we|you|it) may\b|\bmay (i|be)\b/.test(t))) return { m: MONTHS.indexOf(m[1].slice(0, 3)), said: true };
  if (/\bwinter\b|\bchristmas\b|\bholidays?\b|\bsnow\b/.test(t)) return { m: /christmas|holiday/.test(t) ? 11 : 0, said: true };
  if (/\bnew year/.test(t)) return { m: 0, said: true };
  if (/\bsummer\b/.test(t)) return { m: 6, said: true };
  if (/\bspring\b/.test(t)) return { m: 3, said: true };
  if (/\b(fall|autumn)\b/.test(t)) return { m: 9, said: true };
  if (/\bnext month\b/.test(t)) return { m: (now.getMonth() + 1) % 12, said: true };
  return { m: now.getMonth(), said: false };
}
const seasonOf = m => (m === 11 || m <= 1) ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "fall";
const cold = m => m === 11 || m <= 2;

/* ---------- what the person wants ---------- */
const WANTS = [
  ["quiet", /\b(quiet|calm|peaceful|chill|sleep)\b/], ["night", /\b(nightlife|party|parties|bars?|going out|fun|clubs?|dancing)\b/],
  ["cheap", /\b(cheap|cheaper|cheapest|affordable|budget|broke|low rent|inexpensive)\b/], ["family", /\b(kids?|family|families|school|schools|baby|stroller)\b/],
  ["park", /\b(parks?|dogs?|green|trees|running|run|jog)\b/], ["food", /\b(food|restaurants?|eat|foodie)\b/], ["art", /\b(art|artist|artists|creative|studio|music)\b/],
  ["lgbt", /\b(gay|queer|lgbt\w*|trans)\b/], ["water", /\b(water|river|views?|waterfront|beach)\b/], ["midtown", /\b(midtown|grand central|times square|work in manhattan)\b/],
  ["downtown", /\b(fidi|wall street|downtown office|world trade)\b/], ["young", /\b(young|single|meet people|friends|new to|just moved|20s|twenties)\b/],
  ["luxe", /\b(luxury|doorman|fancy|nice building|high end)\b/], ["safe", /\b(safe|safest|safety)\b/],
];
function wantsOf(t) { return WANTS.filter(([, re]) => re.test(t)).map(([k]) => k); }
function budgetOf(t) {
  const m = t.match(/\$\s?(\d{3,5})(?!\d)|\b(\d(?:\.\d)?)\s?k\b|\b(\d{4})\s?(?:a|per|\/)\s?month\b|\bunder (\d{4})\b/);
  if (!m) return null; const n = m[2] ? Math.round(parseFloat(m[2]) * 1000) : Number(String(m[1] || m[3] || m[4]).replace(/,/g, ""));
  return n >= 800 && n <= 20000 ? n : null;
}
/* the quietest precincts, by the NYPD's own weekly numbers, year after year */
const QUIET_PRECINCTS = new Set(["the Upper East Side", "the Upper West Side", "Yorkville", "Park Slope", "Brooklyn Heights", "Bay Ridge", "Forest Hills", "Riverdale", "Carroll Gardens", "Battery Park City", "Roosevelt Island", "Tribeca", "Hudson Heights", "Sunnyside", "Ditmas Park", "Stuyvesant Town", "Gramercy"]);

function rankHoods(pool, wants, m, budget, r) {
  const winter = cold(m);
  return pool.map(h => {
    const tags = h[4].split(" "); let s = r() * 0.6;
    for (const w of wants) { if (w === "safe") s += QUIET_PRECINCTS.has(h[0]) ? 2.5 : 0; else if (tags.includes(w)) s += 2; }
    if (wants.includes("cheap")) s += (4500 - h[2]) / 900;
    if (budget) s += h[2] <= budget ? 1.5 : -(h[2] - budget) / 300;
    if (winter) s += (h[5] - 2) * 1.6;
    else if (seasonOf(m) === "summer" && (tags.includes("park") || tags.includes("water"))) s += 0.8;
    return { h, s };
  }).sort((a, b) => b.s - a.s).map(x => x.h);
}
const money = n => "$" + n.toLocaleString("en-US");
const listOf = a => a.length <= 1 ? (a[0] || "") : a.length === 2 ? a[0] + " or " + a[1] : a.slice(0, -1).join(", ") + " or " + a[a.length - 1];
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- where to live ---------- */
function live(t, ctx) {
  const { r, m, said } = ctx; const winter = cold(m), season = seasonOf(m);
  const boros = findBoroughs(t), wants = wantsOf(t), budget = budgetOf(t);
  let pool = boros.length ? HOODS.filter(h => boros.includes(h[1])) : HOODS.slice();
  if (/\buptown\b/.test(t)) pool = pool.filter(h => /Harlem|Heights|Inwood|Morningside|Upper/.test(h[0]));
  const top = rankHoods(pool, wants, m, budget, r).slice(0, 3);
  const where = boros.length === 1 ? boros[0] : "the city";
  const when = said ? MONTH_NAMES[m] + " " : "";
  const head = `${capFirst(listOf(top.map(h => h[0])))}.`;
  const lines = top.map(h => `${capFirst(h[0])}: ${h[6]}. About ${money(h[2])} for a one bedroom, the ${h[3].split(" ").slice(0, 4).join(" ")}${h[3].split(" ").length > 4 ? " and more" : ""}.`);
  const why = [];
  if (winter) why.push(`Picked for a ${when ? when.trim() : "winter"} move in ${where}: close to an express train, elevator buildings, nothing that depends on a park to be fun.`);
  else if (wants.length) why.push(`Picked for ${listOf(wants.map(w => ({ quiet: "quiet", night: "going out", cheap: "the rent", family: "the kids", park: "a park", food: "the food", art: "the art", lgbt: "the scene", water: "the water", midtown: "the Midtown commute", downtown: "the downtown commute", young: "meeting people", luxe: "a nice building", safe: "the quiet precincts" }[w])))} in ${where}.`);
  const tips = [];
  if (winter) tips.push("Winter is the cheapest season to sign in New York: fewer people hunting, and landlords will knock rent down or give a free month. Ask for one.",
    "Heat is the law from October 1 to May 31: 68 degrees inside by day when it is under 55 out, 62 at night. Look the building up on HPD Online for heat complaints before you sign.");
  else if (season === "summer") tips.push("Summer is the most expensive, fastest market of the year. Bring the folder to the viewing: ID, pay stubs, last tax return, bank statements, a letter from work.");
  else tips.push("Landlords want about 40 times the monthly rent as yearly income, or a guarantor at 80 times. Have the folder ready before you see anything.");
  tips.push("Since June 2025 the FARE Act means that if the landlord hired the broker, the landlord pays the fee, not you.");
  return { kind: "live", theme: "home", head, lines: lines.concat(why, [tips[0], tips[1] || ""]).filter(Boolean).slice(0, 6), where: top.map(h => h[0]), words: top.map(h => bare(h[0]) + " " + h[1]).join(" ") + " apartment block stoop",
    omen: winter ? pick(r, ["Test the radiator before you test the closet", "The apartment that clanks in February is the warm one", "Sign in the cold: landlords are lonely in January", "Five minutes to the train, not ten: winter counts every one"]) : pick(r, ["The apartment exists. It has one weird closet. You'll love the closet", "Stand on the corner at 11 at night before you sign. Then decide", "Bring a tape measure and a question", "Visit at rush hour: the train is the neighborhood"]) };
}

/* ---------- safety ---------- */
function safety(t, ctx) {
  const { r } = ctx; const hoods = findHoods(t);
  if (/\b(safest|safe(st)? (place|neighborhood|area|borough)s?|where.*(feel )?safe)\b/.test(t) && !/\b(rob|robbed|mug|stab|shot)\b/.test(t)) {
    const boros = findBoroughs(t); let pool = HOODS.filter(h => QUIET_PRECINCTS.has(h[0])); if (boros.length) pool = pool.filter(h => boros.includes(h[1])) .concat([]);
    const top = (pool.length ? pool : HOODS.filter(h => QUIET_PRECINCTS.has(h[0]))).slice().sort(() => r() - 0.5).slice(0, 4);
    return { kind: "safety", theme: "city", head: `${capFirst(listOf(top.map(h => h[0])))}.`,
      lines: ["By the NYPD's own weekly numbers, these sit in some of the quietest precincts in the city, year after year.", "Staten Island's South Shore and Bayside in Queens are even quieter, if you want a house and a car.", "Safe in New York is mostly about the block and the hour, not the zip code. Walk it at 11 at night before you commit.", "The real numbers, by precinct, every week: search NYPD CompStat 2.0."],
      where: top.map(h => h[0]), words: top.map(h => bare(h[0])).join(" ") + " park quiet", omen: "The quiet blocks are quiet because people sit on the stoop. Sit on the stoop" };
  }
  if (/\b(subway|train|trains|mta)\b/.test(t) && !/\b(rob|robbed|mug|mugged|stab|stabbed)\b/.test(t) || /\bsubway\b/.test(t) && /\bsafe\b/.test(t)) {
    return { kind: "safety", theme: "move", head: "Yes, for the five million rides a day that end fine. Ride smart at night and you're one of them.",
      lines: ["Late at night, ride in the middle car where the conductor sits, and stand near other people on the platform, not at the empty end.", "Stay back from the platform edge until the train has stopped, and keep your phone in your pocket near the doors.", "If a car is empty when the rest of the train is full, there's a reason. Take the next car.", "Felt unsafe? Tell the conductor or a station agent, or call 911. Real numbers, by precinct and by transit district, are on NYPD CompStat 2.0."],
      where: [], words: "subway station platform", omen: "The empty car is empty for a reason. The booth has smelled it" };
  }
  if (hoods.length && /\b(is|are)\b/.test(t) && /\bsafe\b/.test(t)) {
    const h = hoods[0], q = QUIET_PRECINCTS.has(h[0]);
    return { kind: "safety", theme: "city", head: q ? `Yes. ${capFirst(h[0])} is one of the quieter parts of the city.` : `Mostly, yes. Like most of New York, it depends on the block and the hour.`,
      lines: [`${capFirst(h[0])}: ${h[6]}.`, q ? "Its precinct sits near the bottom of the city's crime tables most years. The usual city rules still apply: phone in your pocket at the train doors." : "Walk the exact block at night before you sign anything, and look the precinct up on NYPD CompStat 2.0, which posts the numbers every week.", "Most crime in this city is property crime in crowds, not strangers hurting strangers."],
      where: [h[0]], words: bare(h[0]) + " " + h[1], omen: "Ask the bodega guy. He knows every block's business" };
  }
  return { kind: "safety", theme: "city",
    head: "Straight answer: you get robbed where it's crowded, and people get hurt in a few specific precincts. Odds are low either way.",
    lines: [
      "Theft and robbery pile up where the crowds are: Times Square, Herald Square and Penn Station, 14th Street and Union Square, and big transfer stations like Fulton Street and 125th. Mostly phones and bags, grabbed at a train door as it closes.",
      "Stabbings and shootings have for years been concentrated in a handful of precincts: parts of the South Bronx (Mott Haven, Melrose, Morrisania, Tremont), Brownsville and East New York in Brooklyn, and pockets of East and Central Harlem. Even there it is specific blocks and late hours, mostly between people who know each other.",
      "How not to be a statistic: phone away near the doors, ride in the middle car where the conductor is late at night, skip the empty car, and never argue with anyone on the street.",
      "The NYPD posts real numbers by precinct every week (CompStat 2.0). Read those, not the comments.",
    ], where: [], words: "subway station platform police precinct", omen: "Phone in the pocket at the doors. That's the whole spell" };
}

/* ---------- where to eat ---------- */
const FOOD = {
  pizza: [["Joe's Pizza", "Carmine Street", "Manhattan", "the folded plain slice everyone means when they say New York slice"], ["Lucali", "Carroll Gardens", "Brooklyn", "candlelit pies, BYOB, put your name in early"], ["L'Industrie", "Williamsburg", "Brooklyn", "the burrata slice, worth the line"], ["Di Fara", "Midwood", "Brooklyn", "an institution, olive oil and scissors"], ["Scarr's", "the Lower East Side", "Manhattan", "a slice shop that mills its own flour"], ["Prince Street Pizza", "Nolita", "Manhattan", "the square with the pepperoni cups"], ["Joe and Pat's", "Castleton Corners", "Staten Island", "the thin crust vodka pie"], ["Mama's Too", "the Upper West Side", "Manhattan", "squares with a crust like a cracker"]],
  bagel: [["Russ and Daughters", "Houston Street", "Manhattan", "lox, a schmear, a hundred years of practice"], ["Ess-a-Bagel", "Midtown East", "Manhattan", "the big chewy kind"], ["Barney Greengrass", "the Upper West Side", "Manhattan", "the Sturgeon King, sturgeon and eggs"], ["Tompkins Square Bagels", "the East Village", "Manhattan", "every schmear you can name"], ["Utopia Bagels", "Whitestone", "Queens", "hand rolled, kettle boiled, worth the trip"], ["Kossar's", "the Lower East Side", "Manhattan", "the bialy, the bagel's older cousin"], ["Leo's Bagels", "the Financial District", "Manhattan", "the downtown one"]],
  dumplings: [["Nan Xiang Xiao Long Bao", "Flushing", "Queens", "soup dumplings, bite the corner first"], ["Joe's Shanghai", "Chinatown", "Manhattan", "the classic soup dumplings"], ["Prosperity Dumpling", "Chinatown", "Manhattan", "a pile of pork and chive for a few dollars"], ["White Bear", "Flushing", "Queens", "wontons in chili oil, a counter, no seats"], ["Tasty Hand-Pulled Noodles", "Chinatown", "Manhattan", "dumplings and noodles on Doyers Street"]],
  deli: [["Katz's", "Houston Street", "Manhattan", "pastrami on rye, tip the cutter"], ["2nd Ave Deli", "Murray Hill", "Manhattan", "matzo ball soup and pastrami"], ["Pastrami Queen", "the Upper East Side", "Manhattan", "the uptown pastrami"]],
  ramen: [["Ivan Ramen", "the Lower East Side", "Manhattan", "the rye noodles"], ["Ippudo", "the East Village", "Manhattan", "the one that started the lines"], ["Totto Ramen", "Hell's Kitchen", "Manhattan", "chicken paitan, a small room"]],
  tacos: [["Los Tacos No. 1", "Chelsea Market", "Manhattan", "adobada, eat standing"], ["Tacos El Bronco", "Sunset Park", "Brooklyn", "the truck and the restaurant on Fifth Avenue"], ["Taqueria Ramirez", "Greenpoint", "Brooklyn", "suadero from the bubbling pan"], ["Tortilleria Nixtamal", "Corona", "Queens", "tortillas made in the back"]],
  halal: [["The Halal Guys", "53rd and Sixth", "Manhattan", "the original cart, white sauce, careful with the red"], ["Sammy's Halal", "Jackson Heights", "Queens", "the cart people line up for at night"]],
  thai: [["Ayada", "Elmhurst", "Queens", "the papaya salad that makes you sweat"], ["Zaab Zaab", "Elmhurst", "Queens", "Isan food, larb, sticky rice"], ["Wayla", "the Lower East Side", "Manhattan", "Thai in a garden room"]],
  indian: [["Adda", "Long Island City", "Queens", "Indian canteen food, the goat biryani"], ["Dhamaka", "the Lower East Side", "Manhattan", "the dishes most menus leave out"], ["Jackson Diner", "Jackson Heights", "Queens", "the buffet that raised half of Queens"]],
  italian: [["Arthur Avenue", "Belmont", "Bronx", "the real Little Italy: Mario's, Zero Otto Nove, the market"], ["Bamonte's", "Williamsburg", "Brooklyn", "red sauce since 1900"], ["Carbone", "Greenwich Village", "Manhattan", "the spicy rigatoni, if you get a table"]],
  steak: [["Peter Luger", "Williamsburg", "Brooklyn", "porterhouse for two, the sauce, the waiters"], ["Keens", "Herald Square", "Manhattan", "the mutton chop under a ceiling of pipes"]],
  brunch: [["Russ and Daughters Cafe", "Orchard Street", "Manhattan", "the board, the latkes"], ["Clinton St. Baking Company", "the Lower East Side", "Manhattan", "the pancakes"], ["Sadelle's", "SoHo", "Manhattan", "the bagel tower"]],
  coffee: [["Devoción", "Williamsburg", "Brooklyn", "beans flown from Colombia, a room full of plants"], ["Abraço", "the East Village", "Manhattan", "tiny, perfect, the olive oil cake"], ["Sey", "Bushwick", "Brooklyn", "light roasts in a sunny warehouse"]],
  cheap: [["Mamoun's", "MacDougal Street", "Manhattan", "falafel, open late, since 1971"], ["Xi'an Famous Foods", "all over", "Citywide", "cumin lamb noodles for about fifteen dollars"], ["Prosperity Dumpling", "Chinatown", "Manhattan", "dumplings by the dozen for pocket change"], ["Joe's Pizza", "Carmine Street", "Manhattan", "a plain slice, folded"]],
  bar: [["Bemelmans Bar", "the Upper East Side", "Manhattan", "murals, a piano, a martini you'll remember"], ["McSorley's", "the East Village", "Manhattan", "the oldest ale house, two choices, light or dark"], ["Employees Only", "the West Village", "Manhattan", "the cocktail bar bartenders go to"], ["Sunny's", "Red Hook", "Brooklyn", "a waterfront bar with live bluegrass"], ["Bohemian Hall", "Astoria", "Queens", "the old beer garden, summer only"]],
  jazz: [["the Village Vanguard", "the West Village", "Manhattan", "the basement where the records were made"], ["Smalls", "the West Village", "Manhattan", "jam sessions until late"], ["Smoke", "the Upper West Side", "Manhattan", "supper club jazz uptown"]],
};
const FOOD_WORDS = { pizza: /\bpizza|slice\b/, bagel: /\bbagels?|lox|schmear\b/, dumplings: /\bdumplings?|chinese|soup dumpling|xlb\b/, deli: /\bpastrami|deli|reuben|matzo\b/, ramen: /\bramen|noodles?|japanese\b/,
  tacos: /\btacos?|mexican|burrito\b/, halal: /\bhalal|cart|chicken over rice|gyro\b/, thai: /\bthai\b/, indian: /\bindian|curry|biryani\b/, italian: /\bitalian|pasta|red sauce|chicken parm\b/, steak: /\bsteak|steakhouse\b/,
  brunch: /\bbrunch|breakfast|pancakes?\b/, coffee: /\bcoffee|espresso|latte|cafe\b/, cheap: /\bcheap|budget|broke\b/, bar: /\bbars?|drinks?|cocktails?|beer|martini\b/, jazz: /\bjazz|live music\b/ };

function food(t, ctx) {
  const { r, file } = ctx; let kind = null;
  for (const [k, re] of Object.entries(FOOD_WORDS)) if (re.test(t)) { kind = k; break; }
  const boros = findBoroughs(t), hoods = findHoods(t);
  const pref = boros[0] || (hoods[0] && hoods[0][1]) || ({ MANHATTAN: "Manhattan", BROOKLYN: "Brooklyn", QUEENS: "Queens", "THE BRONX": "Bronx", "STATEN ISLAND": "Staten Island" }[file && file.borough] || null);
  let list;
  if (kind) list = FOOD[kind].slice();
  else { const ks = ["pizza", "bagel", "dumplings", "deli", "tacos", "thai", "italian", "halal"]; list = ks.map(k => FOOD[k][Math.floor(r() * FOOD[k].length)]); kind = "anything"; }
  list.sort((a, b) => ((pref && b[2] === pref) - (pref && a[2] === pref)) || (r() - 0.5));
  const top = list.slice(0, 3);
  const at = p => /(Street|Avenue|Sixth)$/.test(p) ? "on " : /Market$/.test(p) ? "at " : p === "all over" ? "" : "in ";
  const head = kind === "anything" ? `${top[0][0]} ${at(top[0][1])}${top[0][1]}. Or ${top[1][0]}, or ${top[2][0]}.` : `${top[0][0]}, ${at(top[0][1])}${top[0][1]}.`;
  const lines = top.map(p => `${p[0]}, ${p[1]}${p[2] !== "Citywide" && !p[1].includes(p[2]) ? ", " + p[2] : ""}: ${p[3]}.`);
  if (pref && !top.some(p => p[2] === pref)) lines.push(`Nothing on the booth's list in ${pref} for that one. Ask the person behind you in line.`);
  return { kind: "food", theme: kind === "bar" || kind === "jazz" ? "night" : "food", head, lines, where: top.map(p => p[1]), words: top.map(p => p[1]).join(" ") + " " + (kind === "bar" ? "bar tavern" : kind === "jazz" ? "club music" : "deli counter kitchen"),
    omen: pick(r, ["Order what the person in front of you ordered", "Cash in the pocket. Some of the best counters still prefer it", "Eat standing up once. Decisions taste different", "Go at an odd hour and the line disappears"]) };
}

/* ---------- what to do (tonight, this weekend, a date, bored) ---------- */
const DO = {
  winter: [["Skate at Bryant Park's Winter Village", "free rink, holiday stalls, late October to early March"], ["The Met on a Friday night", "open late, half empty, the Temple of Dendur in the dark"], ["Film Forum", "a revival screening and a slice of their cake"], ["The Village Vanguard", "two sets a night, sit close"], ["The Russian and Turkish Baths on 10th Street", "the hot room, then borscht"], ["The holiday train show at the Botanical Garden", "trains through a city of bark, indoors, November to January"], ["Comedy Cellar", "a basement on MacDougal, buy tickets ahead"], ["Dyker Heights in December", "the most unhinged Christmas lights on earth"], ["Brooklyn Bowl", "bowling, a band and fried chicken"]],
  spring: [["Cherry blossoms at the Brooklyn Botanic Garden", "late April, go on a weekday morning"], ["Governors Island", "the ferry, bikes, hammocks, open daily from May"], ["Smorgasburg", "the food market, Saturdays and Sundays"], ["A Yankees or Mets day game", "bleacher seats and a sunburn"], ["Walk the Brooklyn Bridge at sunset", "start in DUMBO, end in Manhattan"], ["Central Park's Ramble", "warblers in May, birders with big lenses"]],
  summer: [["Rockaway Beach", "the A train to the ocean, tacos on the boardwalk"], ["Little Island", "a park on tulip pillars over the Hudson, free"], ["Shakespeare in the Park", "free, the Delacorte, line up early"], ["SummerStage in Central Park", "free concerts all summer"], ["The Cyclone at Coney Island", "since 1927, then a Nathan's"], ["Bohemian Hall in Astoria", "the old beer garden"], ["Movies in Bryant Park", "Monday nights, bring a blanket"], ["Governors Island", "the ferry, bikes and the slide hill"]],
  fall: [["Prospect Park or Central Park in late October", "the leaves peak around Halloween"], ["The Village Halloween Parade", "October 31, Sixth Avenue, wear something"], ["The marathon", "first Sunday of November, cheer on First Avenue"], ["Green-Wood Cemetery", "a walk among the famous dead, with the best view in Brooklyn"], ["Smorgasburg", "the food market, through October"], ["The Met Cloisters", "medieval gardens at the top of Manhattan, best in fall light"], ["The Village Vanguard", "two sets a night, sit close"], ["Comedy Cellar", "a basement on MacDougal, buy tickets ahead"]],
};
function plans(t, ctx) {
  const { r, m, said } = ctx; const season = seasonOf(m); const date = /\bdate\b/.test(t);
  const list = DO[season].slice().sort(() => r() - 0.5).slice(0, 3);
  const lead = date ? `For a ${season} date: ${list[0][0]}.` : `${list[0][0]}.`;
  const lines = list.map(x => `${x[0]}: ${x[1]}.`);
  if (date) lines.push("Then dinner somewhere you can hear each other. Pick a place with a bar so you can sit side by side.");
  if (!said && cold(m)) lines.push("It's cold out, so every pick above has a roof or a hot drink.");
  return { kind: "plans", theme: date ? "love" : "night", head: lead, lines, where: [], words: list.map(x => x[0]).join(" ").toLowerCase(),
    omen: date ? pick(r, ["Sit side by side, not across. The city's oldest trick", "Walk them to the train. That's the date", "Pick the place with a bar and a candle"]) : pick(r, ["The best night out is the one you almost skipped", "Leave the house. The city does the rest", "Be home before the trains thin, or don't"]) };
}

/* ---------- weather and what to wear ---------- */
function weather(t, ctx) {
  const { m, said, r } = ctx; const [hi, lo] = NORMALS[m]; const name = MONTH_NAMES[m];
  const wear = hi < 45 ? "A real coat, a hat and gloves, boots that handle slush. The wind between the towers is the part nobody warns you about." : hi < 60 ? "A warm jacket and layers. The subway is hot, the street is not." : hi < 75 ? "A light jacket for the evening. Best walking weather of the year." : "As little as the law allows, plus a sweater for the subway car, which is freezing.";
  return { kind: "weather", theme: "move", head: `${said ? name : "This time of year"}: highs around ${hi}, lows around ${lo}.`, lines: [wear, m === 0 || m === 1 ? "Snow comes a few times a winter, usually melts to grey slush in a day. The corner puddles are deeper than they look." : m >= 5 && m <= 7 ? "Expect at least one heat wave and some thunderstorms that arrive at 5 PM sharp." : "It can swing twenty degrees in a day. Check the morning of."],
    where: [], words: "street avenue weather", omen: pick(r, ["Carry the umbrella. The day you don't is the day", "Dress for the platform, not the street", "Layers: the city has four climates in one commute"]) };
}

/* ---------- getting around ---------- */
function transit(t, ctx) {
  const { r } = ctx;
  if (/\bjfk\b|kennedy/.test(t)) return { kind: "transit", theme: "move", head: "To JFK: the A or E train to the AirTrain, or the LIRR to Jamaica and the AirTrain.", lines: ["The LIRR from Penn or Grand Central to Jamaica is the fast one, about twenty minutes, then the AirTrain to your terminal.", "The A is cheapest; make sure it's going to Far Rockaway or Howard Beach, not Lefferts.", "A cab from Manhattan has a flat fare plus tolls and tip. In rush hour the train wins."], where: [], words: "airport terminal train", omen: "Leave thirty minutes earlier than you think. The Van Wyck is a mood" };
  if (/\blaguardia|lga\b/.test(t)) return { kind: "transit", theme: "move", head: "To LaGuardia: the free Q70 bus from Jackson Heights or Woodside.", lines: ["Take the 7, E, F, M or R to Jackson Heights, or the LIRR to Woodside, then the Q70 LaGuardia Link. The bus is free.", "From upper Manhattan, the M60 runs across 125th Street to the terminals.", "A cab is fine outside rush hour. In rush hour, the bus lane wins."], where: [], words: "airport terminal", omen: "The Q70 is free. The best things in Queens are" };
  if (/\bnewark|ewr\b/.test(t)) return { kind: "transit", theme: "move", head: "To Newark: NJ Transit from Penn Station to Newark Airport, then the AirTrain.", lines: ["Trains run often; buy the ticket to Newark Liberty Airport, the AirTrain is included.", "About thirty minutes from Penn, far more reliable than a car through the tunnel."], where: [], words: "airport terminal train penn station", omen: "Penn Station, then out. The booth is sorry about Penn Station" };
  if (/\bairport\b/.test(t)) return { kind: "transit", theme: "move", head: "The train, unless it's 2 AM or you have three bags. Which airport decides how.", lines: ["JFK: the LIRR to Jamaica, then the AirTrain. Or the A or E for less.", "LaGuardia: the 7, E, F, M or R to Jackson Heights, then the free Q70 bus.", "Newark: NJ Transit from Penn Station to Newark Airport, AirTrain included."], where: [], words: "airport terminal train", omen: "Leave thirty minutes earlier than you think" };
  return { kind: "transit", theme: "move", head: "Tap your phone or card at the turnstile and take the express when it matches your stop.", lines: ["OMNY caps your fares: after a set number of rides in seven days, the rest of the week is free.", "Google or Citymapper for the route, the MTA app for the service changes. Weekend service changes are the real enemy.", "Stand clear of the closing doors. They will not reopen for you."], where: [], words: "subway station platform", omen: pick(r, ["Your train is the one that's coming", "The express skips your stop for a reason. Find out which"]) };
}

/* ---------- this or that ---------- */
function compare(t, ctx) {
  const { r, m } = ctx;
  const hs = findHoods(t), bs = findBoroughs(t);
  if (hs.length >= 2) {
    const [a, b] = hs, winA = cold(m) ? a[5] >= b[5] : r() < 0.5 + (b[2] - a[2]) / 8000, win = winA ? a : b, lose = winA ? b : a;
    return { kind: "compare", theme: "home", head: `${capFirst(win[0])}.`, lines: [`${capFirst(win[0])}: ${win[6]}. About ${money(win[2])}.`, `${capFirst(lose[0])}: ${lose[6]}. About ${money(lose[2])}.`, cold(m) ? "It's winter math: the one with the better train and the warmer buildings wins." : `Pick ${lose[0]} instead if ${lose[4].split(" ")[0] === "night" ? "you want to go out more than you want to sleep" : "the rent difference matters more than the walk"}.`],
      where: [win[0]], words: bare(win[0]) + " " + win[1], omen: "Visit both at 8 AM on a weekday. The train decides" };
  }
  if (bs.length >= 2) {
    const take = { Manhattan: "the convenience and the price of it", Brooklyn: "more room, brownstones, and still close", Queens: "the best food and the best value", Bronx: "the most space for the money and the parks", "Staten Island": "a house, a car and the ferry" };
    const win = bs[Math.floor(r() * 2)];
    return { kind: "compare", theme: "city", head: `${win}, if you made the booth choose.`, lines: bs.slice(0, 2).map(b => `${b}: ${take[b]}.`).concat([`Start with ${listOf(rankHoods(HOODS.filter(h => h[1] === win), [], m, null, r).slice(0, 2).map(h => h[0]))}.`]),
      where: rankHoods(HOODS.filter(h => h[1] === win), [], m, null, r).slice(0, 1).map(h => h[0]), words: win, omen: "Every borough thinks it won. Every borough is right once a week" };
  }
  return null;
}

/* ---------- should I, will I, is it: a verdict and the condition ---------- */
const VERDICT = {
  quit: [["NOT YET", "Line up the next thing first. Rent is due on the first whether you were brave or not."], ["YES", "If you've hated Sunday nights for a year, the booth already knows. Give notice once the next offer is in writing."]],
  job: [["YES", "If it pays more and the commute is under 45 minutes door to door. A long commute eats a raise by March."], ["YES, BUT", "Ask for more first. New York offers always have room, and nobody respects the first number."]],
  leave: [["STAY ONE MORE WINTER", "If you can do February and still want it, you're a New Yorker. If you've done three and still dread November, go, and visit."], ["GO", "The city will be here. It is better visited than resented."]],
  text: [["YES", "Short, once, then put the phone face down. Either answer is better than the waiting."], ["NO", "If you have to ask a booth, you already wrote it four times. Delete it. Go outside."]],
  move: [["YES", "Move in winter if you can: cheaper rent, fewer people at the viewings."], ["NOT YET", "Save three months of rent first. Moving here costs more than the first month."]],
  buy: [["THE BOOTH DOESN'T DO MONEY", "No financial advice from a booth. The census is art, not an investment."]],
  sports: [["YES", "They always do, and you'll be back in October with a new jersey. That's not luck, that's love."], ["NOT THIS YEAR", "This year they only break it a little. Get the cheap seats and enjoy the part before the playoffs."]],
  will: [["LIKELY", "If you do the boring part this week."], ["NOT THE WAY YOU THINK", "Sideways, later, better."], ["YES", "Sooner than you planned and less tidy."], ["ASK AGAIN IN THE SPRING", "The answer is still forming."]],
  generic: [["YES", "The fact that you asked out loud says you've decided."], ["NO", "If it needs a fortune booth's permission, it's not the move yet."], ["YES, BUT", "Do it small first. Test it on a Tuesday."], ["NOT YET", "Give it until the next season. Then ask again."]],
};
function verdict(t, ctx) {
  const { r } = ctx; let k = null;
  if (/\bbodega cat\b/.test(t)) return { kind: "verdict", theme: "food", head: "YES.", lines: ["It judges everyone. Buy something, say hi to the guy at the register, and it softens. That's the whole economy of the block."], where: [], words: "bodega deli counter", verdict: "YES", omen: "The cat was here before you and will be here after the lease" };
  if (/\b(knicks|mets|jets|giants|nets|yankees|rangers|islanders|liberty)\b/.test(t)) k = "sports";
  else if (/^(does|do|will|is) (he|she|they|my)\b/.test(t)) k = "will";
  else if (/\b(quit|resign|leave (my|the) job)\b/.test(t)) k = "quit";
  else if (/\b(take|accept) (the|this|that|a|my) (job|offer|role|position)\b|\bjob offer\b/.test(t)) k = "job";
  else if (/\b(leave|move out of) (nyc|new york|the city)\b|\bstay or (go|leave)\b|\bdo i stay\b/.test(t)) k = "leave";
  else if (/\b(text|call|dm|message) (him|her|them|my ex|back)\b/.test(t)) k = "text";
  else if (/\bmove (to|here|out)\b/.test(t)) k = "move";
  else if (/\b(buy|sell|invest|ape)\b/.test(t)) k = "buy";
  else if (/^(will|am i going to|is it going to|are we going to)\b/.test(t)) k = "will";
  else if (/^(should|do i|is it|can i|would|could|does|is this|am i)\b|\bshould i\b/.test(t)) k = "generic";
  if (!k) return null;
  const v = pick(r, VERDICT[k]);
  return { kind: "verdict", theme: null, head: `${v[0]}.`, lines: [v[1]], where: [], words: "", verdict: v[0] };
}

/* ---------- money and work, the practical lines ---------- */
function afford(t, ctx) {
  if (!/\b(afford|how much|salary|make to live|income)\b/.test(t) || !/\b(rent|live|apartment|nyc|new york|manhattan|brooklyn|queens)\b/.test(t)) return null;
  const b = budgetOf(t), bo = findBoroughs(t)[0], boro = bo ? Math.round(HOODS.filter(h => h[1] === bo).reduce((a, h) => a + h[2], 0) / HOODS.filter(h => h[1] === bo).length / 100) * 100 : null;
  const lines = ["Landlords want yearly income of about 40 times the monthly rent. A $3,000 apartment wants $120,000, or a guarantor earning 80 times.", "No guarantor? Companies like TheGuarantors and Insurent will act as one for a fee.", "Cheapest real neighborhoods with a fast train: Washington Heights, Jackson Heights, Crown Heights, Sunset Park, Ridgewood."];
  if (b) lines.unshift(`At ${money(b)} a month you need about ${money(b * 40)} a year on paper.`);
  return { kind: "afford", theme: "money", head: /^will i\b/.test(t) ? "Yes, if you hunt where the trains are fast and the rent is slow, and your income is 40 times the rent." : boro ? `About ${money(boro * 40)} a year on paper for a typical ${money(boro)} one bedroom in ${findBoroughs(t)[0]}, or a roommate.` : "The rule is 40 times the rent.", lines, where: ["Washington Heights", "Jackson Heights"], words: "apartment rent block", omen: "Roommates are a New York tradition, not a failure" };
}

/* ---------- lost something ---------- */
function lostFound(t) {
  if (!/\b(lost|left|forgot|dropped)\b/.test(t) || !/\b(train|subway|bus|cab|taxi|uber|lyft|l|a|g|j|[1-7]|metro north|lirr|on the)\b/.test(t)) return null;
  if (/\b(cab|taxi)\b/.test(t)) return { kind: "lost", theme: "lost", head: "Yellow or green cab: call 311 and ask for taxi lost property.", lines: ["Have the time, pickup and drop off, and the receipt if you got one; the medallion number on it finds the driver fast.", "Uber or Lyft: open the trip in the app and use the lost item option, it calls the driver for you."], where: [], words: "taxi street avenue", omen: "Things left in cabs come home more often than you think" };
  if (/\b(lirr|metro north)\b/.test(t)) return { kind: "lost", theme: "lost", head: "File it with the MTA's Lost and Found online today, and name the railroad.", lines: ["LIRR and Metro North items go to their own lost and found offices at Penn Station and Grand Central.", "Give the train time, the car if you know it, and a detail only the owner would know."], where: [], words: "terminal station", omen: "The commuter rail is honest. Mostly" };
  return { kind: "lost", theme: "lost", head: "Report it to MTA Lost and Found online today. Subway and bus finds end up at its office in the 34th Street Penn Station subway station.", lines: ["Describe it with one detail only you would know (a sticker, a scratch, what's inside), plus the line, direction and time.", "It can take a few days for an item to be logged, so check back, and a station agent can tell you if it was just handed in.", "Phones: put it in lost mode now, from another device."], where: [], words: "subway station platform", omen: "What you lost on the train is riding the whole line looking for you" };
}

function pick(r, a) { return a[Math.floor(r() * a.length)]; }

/* ---------- the dispatcher ---------- */
export function answer(q, seed, opts) { const a = route(q, seed, opts); if (a && a.head) a.head = capFirst(a.head); return a; }
function route(q, seed, opts) {
  opts = opts || {}; const t = norm(q); if (!t) return null;
  const now = opts.now ? new Date(opts.now) : new Date();
  const mo = monthOf(t, now);
  const ctx = { r: rng((seed ^ hash("answer|" + t)) >>> 0), m: mo.m, said: mo.said, file: opts.file || {}, now };
  const hasWhere = /\b(where|which|what|best|recommend|good|should i|suggest|any|top)\b/.test(t);
  if (/\b(rob|robbed|robbery|mug|mugged|stab|stabbed|stabbing|get shot|shot at|shootings?|safe|safest|unsafe|dangerous|danger|sketchy|crime|pickpocket\w*|attacked|murder\w*)\b/.test(t)) return safety(t, ctx);
  const af = afford(t, ctx); if (af) return af;
  const lf = lostFound(t); if (lf) return lf;
  if (/\b(jfk|laguardia|lga|newark|ewr|airport)\b/.test(t) || /\b(how do i get|which train|what train|subway tips?|omny|metrocard)\b/.test(t)) return transit(t, ctx);
  if (/\b(weather|cold|hot|wear|coat|snow|rain|temperature|humid)\b/.test(t) && !/\b(live|move|lease|apartment|eat)\b/.test(t)) return weather(t, ctx);
  if (/ or /.test(t) && (findHoods(t).length >= 2 || findBoroughs(t).length >= 2)) { const c = compare(t, ctx); if (c) return c; }
  const liveRe = /\b(move|moving|relocate|live|living|lease|apartment|apt|rent|renting|neighborhood|neighbourhood|1br|one bedroom|studio|sublet|roommates?|place to live)\b/;
  if (liveRe.test(t) && (hasWhere || findBoroughs(t).length || budgetOf(t) || /\b(lease|neighborhood|need a|looking for)\b/.test(t))) {
    if (/^should i move to\b/.test(t) && findBoroughs(t).length === 1 && !findHoods(t).length) {
      const b = findBoroughs(t)[0], r = ctx.r; const top = rankHoods(HOODS.filter(h => h[1] === b), [], ctx.m, null, r).slice(0, 3);
      return { kind: "live", theme: "home", head: `Yes, if you start in ${listOf(top.map(h => h[0]))}.`, lines: top.map(h => `${capFirst(h[0])}: ${h[6]}. About ${money(h[2])}.`).concat(["Visit at 8 AM on a weekday and ride the train in. The commute is the neighborhood."]), where: top.map(h => h[0]), words: top.map(h => bare(h[0])).join(" ") + " " + b, omen: "Every borough is somebody's whole world. Try it for a weekend" };
    }
    if (/^should i move to\b/.test(t) && findHoods(t).length) { const h = findHoods(t)[0]; return { kind: "live", theme: "home", head: `${QUIET_PRECINCTS.has(h[0]) || h[5] >= 2 ? "Yes" : "Maybe"}: ${h[6]}.`, lines: [`About ${money(h[2])} for a one bedroom, the ${h[3]}.`, cold(ctx.m) && h[5] < 2 ? "In winter, check the walk to the train first. It's the part that hurts." : "Walk it at night and at rush hour before you sign."], where: [h[0]], words: bare(h[0]) + " " + h[1], omen: "The neighborhood you visit on Saturday is not the one you live in on Tuesday" }; }
    return live(t, ctx);
  }
  const foodRe = /\b(eat|eats|eating|food|hungry|dinner|lunch|breakfast|brunch|pizza|slice|bagels?|dumplings?|pastrami|deli|ramen|noodles?|tacos?|halal|thai|indian|italian|steak|coffee|restaurant|bars?|drinks?|cocktails?|beer|jazz)\b/;
  if (foodRe.test(t) && !/^(is|does|will|am)\b/.test(t)) return food(t, ctx);
  if (/\b(tonight|this weekend|weekend|things to do|what to do|what should i do|date ideas?|for a date|first date|bored|fun|go out|visits?|visiting|tourist|sightseeing|take (my|her|him|them|the kids)|show (them|my|her|him))\b/.test(t)) return plans(t, ctx);
  const v = verdict(t, ctx); if (v) return v;
  return null;
}
export { HOODS as __HOODS, monthOf as __monthOf };
