/* assign_hang.mjs
   Give every New Yorker exactly one room, and write the result to src/hang_owned.ts.

   Why this exists. placeHang() in data.ts scores the whole census once per room
   and takes the top slice. Nothing stops two rooms scoring the same piece
   highest, and rooms with neighbouring curation do it constantly: the export of
   2026-09-06 hung 2,343 works that were only 1,981 distinct pieces, so 326
   mountings were repeats, and one piece hung in six different rooms. With 7,541
   painted and 2,335 mounts in the building there is no reason for any repeat.

   The rule here is simple and total: a piece belongs to the room that wants it
   most, measured with the same scoring placeHang already uses, and it hangs
   nowhere else. Rooms left short are topped up from the pieces no room claimed,
   dealt round robin so those cannot collide either.

   One exception, made on purpose. PINNED hands a room a fixed list before any
   scoring happens: room 180, pennstation, the 1910 census hall, hangs the
   KEYSTONE 111, the founding New Yorkers, in ramp order from
   _build/api/keystone_prints.json. Those 111 belong to pennstation and to no
   other room, so the one room rule still holds and build_collectors.py still
   gives every Keystone holder one home. A pinned room is exempt from CAP (111 is
   more than its share) and takes nothing else, and every pinned piece counts as
   a lead, so placeHang rotates which Keystone works sit on the 24 big mounts each
   New York day. This file also writes src/keystone.ts, the same list as a module,
   so the bundle never fetches it at runtime.

   Run it whenever data.js, the CURATION table or the Keystone list changes:
     node assign_hang.mjs            write src/hang_owned.ts
     node assign_hang.mjs --check    report only, write nothing
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '..', '..');
const DATA = path.join(SITE, 'assets', 'data.js');
const DATA_TS = path.join(here, 'src', 'data.ts');
const USED_TS = path.join(here, 'src', 'used.ts');
const OUT = path.join(here, 'src', 'hang_owned.ts');
const KEYSTONE_JSON = path.join(SITE, '_build', 'api', 'keystone_prints.json');
const KEYSTONE_TS = path.join(here, 'src', 'keystone.ts');

/* Every room needs enough of its own to fill its walls and page a little. The
   busiest room in the building carries 38 mounts. */
const FLOOR = 60;

/* ---------- the census ---------- */
const raw = fs.readFileSync(DATA, 'utf8');
const D = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
const P = D.pieces;
const HEROES = new Set(Object.values(D.story.eraHeroes).flat());

/* ---------- the curation table, read from data.ts itself ---------- */
/* Parsing beats duplicating: the regexes stay authored in one place. */
const src = fs.readFileSync(DATA_TS, 'utf8');
const start = src.indexOf('const CURATION');
if (start < 0) throw new Error('CURATION not found in data.ts');
const open = src.indexOf('{', src.indexOf('=', start));
let depth = 0, end = -1;
for (let i = open; i < src.length; i++) {
  const ch = src[i];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) throw new Error('CURATION literal did not close');
const CURATION = (0, eval)('(' + src.slice(open, end + 1) + ')');
const ROOM_IDS = Object.keys(CURATION);

/* ---------- pieces already hung in an exported room ---------- */
const usedSrc = fs.readFileSync(USED_TS, 'utf8');
const USED = new Set((usedSrc.match(/\[([\d,\s]+)\]/) || [, ''])[1].split(',').map(Number).filter(Boolean));

/* ---------- pinned rooms ---------- */
/* The Keystone 111 in ramp order, read from the print kit's list. Every number
   must be a hangable piece in data.js, or the room would hang a hole. */
const KS = JSON.parse(fs.readFileSync(KEYSTONE_JSON, 'utf8')).pieces.slice().sort((a, b) => a.pos - b.pos);
const KEYSTONE = KS.map((q) => q.n);
const PINNED = { pennstation: KEYSTONE };
{
  const hangable = new Set(P.filter((p) => p.n != null && p.st && p.st.length).map((p) => p.n));
  const pinnedSeen = new Set();
  for (const [id, nums] of Object.entries(PINNED)) {
    if (!(id in CURATION)) throw new Error(`pinned room ${id} is not in CURATION`);
    for (const n of nums) {
      if (!hangable.has(n)) throw new Error(`pinned piece ${n} for ${id} is not a hangable piece in data.js`);
      if (pinnedSeen.has(n)) throw new Error(`piece ${n} is pinned twice`);
      pinnedSeen.add(n);
    }
  }
}

/* ---------- the same score placeHang uses ---------- */
function score(p, c) {
  let s = 0;
  if (p.nb && c.nb.includes(p.nb)) s += p.nb === c.nb[0] ? 9 : 6;
  else if (p.loc && c.nb.includes(p.loc)) s += 5;
  if (c.words.test(p.t)) s += 5;
  if (p.story && c.words.test(p.story)) s += 3;
  if (p.nb && c.words.test(p.nb)) s += 2;
  if (c.fam && c.fam.includes(p.f)) s += 2;
  if (c.boro && c.boro.includes(p.b)) s += 1.5;
  if (c.cat && p.cat && c.cat.includes(p.cat)) s += 6;
  if (HEROES.has(p.n)) s += 0.75;
  return s;
}

/* ---------- claim ---------- */
/* Capacity constrained, best offer first. Scoring alone is not enough: left to
   itself the Bronx botanical room claims 380 pieces on a borough match while
   sixty four rooms are left under the number of mounts they have to fill. So
   every room gets an equal share of the census and the strongest claim on any
   piece wins a place in the room that made it, while that room still has room. */
const CAP = Math.ceil(P.length / ROOM_IDS.length);

const offers = [];
let scored = 0;
for (let i = 0; i < P.length; i++) {
  const p = P[i];
  if (p.n == null || !p.st || !p.st.length) continue;
  scored++;
  for (let r = 0; r < ROOM_IDS.length; r++) {
    const c = CURATION[ROOM_IDS[r]];
    const s = score(p, c);
    if (s <= 0) continue;
    /* A fresh room breaks a tie in its own favour: it exists to show work the
       museum has not shown, so it should win a piece nobody has hung yet. */
    offers.push([s + (c.fresh && !USED.has(p.n) ? 0.25 : 0), i, r]);
  }
}
/* Strongest claim first. Ties resolve by piece then by room, both stable, so
   the same census and the same table always produce the same museum. */
offers.sort((a, b) => b[0] - a[0] || a[1] - b[1] || a[2] - b[2]);

const owned = new Map(ROOM_IDS.map((id) => [id, []]));
const takenBy = new Map();
/* Pinned pieces are claimed first, so no scored offer can take one elsewhere.
   They carry a positive score so they count as leads, and the room is marked
   so it takes nothing more. */
const pinnedRooms = new Set(Object.keys(PINNED));
for (const [id, nums] of Object.entries(PINNED)) {
  for (const n of nums) { owned.get(id).push({ n, s: 1, pin: true }); takenBy.set(n, id); }
}
for (const [s, i, r] of offers) {
  const p = P[i];
  if (takenBy.has(p.n)) continue;
  const id = ROOM_IDS[r];
  if (pinnedRooms.has(id)) continue;
  const list = owned.get(id);
  if (list.length >= CAP) continue;
  list.push({ n: p.n, s });
  takenBy.set(p.n, id);
}

/* Anything no room could take, either because nothing matched it or because
   every room that wanted it was full. Dealt round robin, shortest room first,
   so two rooms can never be topped up with the same piece. */
const unclaimed = [];
for (const p of P) {
  if (p.n == null || !p.st || !p.st.length) continue;
  if (!takenBy.has(p.n)) unclaimed.push(p.n);
}
unclaimed.sort((a, b) => a - b);
let cursor = 0;
while (cursor < unclaimed.length) {
  const queue = ROOM_IDS.filter((id) => !pinnedRooms.has(id) && owned.get(id).length < CAP)
    .sort((a, b) => owned.get(a).length - owned.get(b).length || (a < b ? -1 : 1));
  if (!queue.length) break;
  for (const id of queue) {
    if (cursor >= unclaimed.length) break;
    const n = unclaimed[cursor++];
    owned.get(id).push({ n, s: 0 });
    takenBy.set(n, id);
  }
}

/* Strongest first inside a room. placeHang still reshuffles the leads daily, so
   this order decides who is in the running, not who is on which wall. */
for (const [id, list] of owned) if (!pinnedRooms.has(id)) list.sort((a, b) => b.s - a.s || a.n - b.n);

/* ---------- report ---------- */
const counts = ROOM_IDS.map((id) => owned.get(id).length);
const seen = new Set();
let dupes = 0;
for (const list of owned.values()) for (const o of list) { if (seen.has(o.n)) dupes++; seen.add(o.n); }
const sorted = counts.slice().sort((a, b) => a - b);
const thin = ROOM_IDS.filter((id) => owned.get(id).length < FLOOR);

console.log(`rooms ${ROOM_IDS.length}, cap ${CAP}, pieces placed ${seen.size} of ${scored} hangable`);
console.log(`  matched by curation ${scored - unclaimed.length}, dealt round robin ${unclaimed.length}`);
console.log(`  per room: min ${sorted[0]}, median ${sorted[sorted.length >> 1]}, max ${sorted[sorted.length - 1]}`);
console.log(`  rooms under the floor of ${FLOOR}: ${thin.length}${thin.length ? ' (' + thin.slice(0, 8).join(', ') + ')' : ''}`);
console.log(`  duplicate assignments: ${dupes}`);
for (const [id, nums] of Object.entries(PINNED)) {
  const got = owned.get(id).map((o) => o.n);
  const stray = nums.filter((n) => takenBy.get(n) !== id).length;
  console.log(`  pinned ${id}: ${got.length} pieces (${nums.length} pinned, ${stray} claimed elsewhere), leads ${owned.get(id).filter((o) => o.s > 0).length}`);
  if (stray || got.length !== nums.length) throw new Error(`pinned room ${id} does not hold exactly its pinned list`);
}
if (dupes) throw new Error('a piece was assigned to two rooms, which is the whole thing this file exists to prevent');

if (process.argv.includes('--check')) process.exit(0);

const body = ROOM_IDS.map((id) => `  ${JSON.stringify(id)}: [${owned.get(id).map((o) => o.n).join(',')}],`).join('\n');
/* How many of each room's pieces the curation actually matched. placeHang
   reshuffles that leading segment daily and leaves the round robin tail in
   place, so the room still changes without losing the people who belong to it. */
const leads = ROOM_IDS.map((id) => `  ${JSON.stringify(id)}: ${owned.get(id).filter((o) => o.s > 0).length},`).join('\n');
fs.writeFileSync(OUT, `/* Generated by assign_hang.mjs. Do not edit by hand.

   Every New Yorker belongs to exactly one room: the room whose curation scores
   it highest, with rooms left short topped up from the pieces no room claimed.
   placeHang() hangs a room out of this list and nothing else, which is what
   makes "no piece hangs in two rooms" true rather than merely intended.

   ${seen.size} pieces across ${ROOM_IDS.length} rooms. Rerun after data.js or CURATION changes. */
export const OWNED: Record<string, number[]> = {
${body}
};
export const LEADS: Record<string, number> = {
${leads}
};
`);
console.log(`wrote ${path.relative(SITE, OUT)}`);
fs.writeFileSync(KEYSTONE_TS, `/* Generated by assign_hang.mjs from _build/api/keystone_prints.json. Do not edit by hand.

   THE KEYSTONE 111, the founding New Yorkers, as census numbers in ramp order.
   Room 180 (pennstation) hangs them on its salon wall and its big mounts; assign_hang
   pins all of them to that room, so they hang nowhere else in the museum. */
export const KEYSTONE: number[] = [${KEYSTONE.join(',')}];
`);
console.log(`wrote ${path.relative(SITE, KEYSTONE_TS)} (${KEYSTONE.length} numbers)`);
