#!/usr/bin/env node
/* Ten thousand MLOWTAR readings, pre generated for red teaming.
 *
 * Runs the same oracle the browser runs (assets/mlowtar/oracle.js) in Node against the real deck and the
 * real rooms, with random questions from a bank and random files, and writes:
 *   <out>/fortunes_10000.jsonl   one reading a line: question, file, seed, the full script, card, room, lucky
 *   <out>/stats.md               theme coverage, distinct scripts, longest line, any dash or banned word
 *
 *   node _build/mlowtar_fortunes.mjs "../MLOWTAR HANDOFF 2026-10-12" [count]
 */
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), SITE = path.dirname(HERE);
const { read, script, FILE, STARTERS } = await import(path.join(SITE, "assets/mlowtar/oracle.js"));
const { themeOf, rng: RNG } = await import(path.join(SITE, "assets/mlowtar/match.js"));
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(path.dirname(SITE), "MLOWTAR HANDOFF 2026-10-12");
const N = Number(process.argv[3] || 10000); fs.mkdirSync(out, { recursive: true });
const deck = JSON.parse(fs.readFileSync(path.join(SITE, "assets/mlowtar/deck.json"), "utf8"));
const rooms = JSON.parse(fs.readFileSync(path.join(SITE, "api/rooms.json"), "utf8"));
const QUESTIONS = STARTERS.concat([
  "Will I ever afford an apartment in Brooklyn?", "Should I text my ex?", "Is my landlord going to raise the rent?", "Should I quit my job and paint?",
  "Where should I eat in Queens tonight?", "Will the L train ever run on time?", "I lost my grandmother last week", "Am I going to be famous?",
  "Should I buy more eth?", "Do I belong here?", "What should I do about my roommate?", "Will I get the promotion?", "Is she the one?",
  "Should I move back home?", "What's my lucky number?", "Where did I leave my keys?", "Will it rain on my birthday?", "How do I make friends in this city?",
  "Should I open a restaurant?", "Is the Bronx my borough?", "Will my show sell out?", "Can I trust my business partner?", "Should I adopt the stray cat?",
  "What happens after the lease ends?", "Why does the G train hate me?", "Will my mom like him?", "Is it too late to start over?", "Where should I go tonight?",
  "Should I take the 2 AM train or a cab?", "Am I wasting my twenties?", "Will the deli reopen?", "Do I say yes to the wedding?", "Is Staten Island worth the ferry?",
  "What does Manhattan want from me?", "Should I learn to drive?", "Will I finish the novel?", "Is the pizza place cursed?", "Who is watching me on the train?",
  "Should I sell the painting?", "Will my kid be okay?", "How do I get over the breakup?", "Where is the best bagel?", "Am I a real New Yorker yet?",
  "Should I run the marathon?", "Will the Mets do it this year?", "Is my apartment haunted?", "Should I go to the party?", "Do I take the money or the time?",
  "", "ok", "hello?", "tell me something good", "what", "fortune please", "I'm scared", "I'm bored", "I'm in love", "I'm broke",
]);
const r = RNG(20261012), pick = a => a[Math.floor(r() * a.length)];
const lines = [], seen = new Set(), themes = {}, bad = [];
const BANNED = /—|–|->|=>|\butilize\b|\bjourney\b|\bvibe\b|\benergy\b|\bmanifest\b|\buniverse\b|\balign\b|\bunlock\b|\belevate\b|\bembrace\b|!/;
let maxLen = 0, maxLine = "";
for (let i = 0; i < N; i++) {
  const q = pick(QUESTIONS), file = {}; if (r() < 0.8) for (const f of FILE) file[f.k] = pick(f.a)[1];
  const seed = Math.floor(r() * 4294967295) >>> 0;
  const res = read(q, seed, deck, rooms, { file });
  const sc = script(res); const key = sc.join(" | ");
  seen.add(key); themes[res.theme] = (themes[res.theme] || 0) + 1;
  for (const l of sc) { if (l.length > maxLen) { maxLen = l.length; maxLine = l; } if (BANNED.test(l)) bad.push({ i, l }); }
  lines.push(JSON.stringify({ i, question: q, file: res.file, seed, theme: res.theme, script: sc, card: res.card && { id: res.card.id, title: res.card.title, family: res.card.family, neighborhood: res.card.neighborhood }, room: res.room && { id: res.room.id, name: res.room.name, area: res.room.area }, lucky: res.lucky, replay: `https://n3wyorkers.com/mlowtar#q=${encodeURIComponent(q)}&s=${seed}` }));
}
fs.writeFileSync(path.join(out, `fortunes_${N}.jsonl`), lines.join("\n") + "\n");
const omens = new Set(lines.map(l => JSON.parse(l).script.find(x => x) ));
const stats = [`# MLOWTAR pre generated readings`, ``, `${N} readings, ${seen.size} distinct scripts (${(100 * seen.size / N).toFixed(2)}%).`, ``, `## Theme coverage`, ``, ...Object.entries(themes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`), ``, `## Longest line`, ``, `${maxLen} characters: "${maxLine}"`, ``, `## Dash or banned word hits`, ``, bad.length ? bad.slice(0, 50).map(b => `- #${b.i}: ${b.l}`).join("\n") : "none", ``].join("\n");
fs.writeFileSync(path.join(out, "stats.md"), stats);
console.log(`wrote ${N} readings to ${out}; distinct ${seen.size}; banned hits ${bad.length}`);
