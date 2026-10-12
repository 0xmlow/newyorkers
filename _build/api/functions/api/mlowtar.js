/* POST /api/mlowtar  ->  MLOWTAR, awake.
 *
 * The booth on mlowtar.html answers on its own from the census deck and the museum rooms. When this Function
 * has a key it answers instead, as an agent: Claude plays MLOWTAR, searches the deck and the rooms with two
 * tools (the same matcher the browser uses), then hands the slip back through a third. The browser merges what
 * comes back over its own reading, so a half answer is never a broken answer, and without a key or on any
 * failure it returns 503 and the booth carries on alone.
 *
 * Body: { messages: [{role:"user"|"assistant", content:"..."}] }  the last one is the question (<= 12 turns).
 * Reply: { ok, mode:"live", theme, fortune:{greet, reading[], omen, closer}, card:{...}, room:{...}, lucky:{train} }
 *
 * Secrets on the Pages project: ANTHROPIC_API_KEY (required). Optional vars: MLOWTAR_MODEL (default
 * claude-opus-5-5), MLOWTAR_EFFORT (default low). D1 `DB` is optional: when bound, the hit_rate table from
 * schema_hits.sql rate limits to 12 consults a minute per ip hash, which lives only inside the request.
 *
 * Raw fetch instead of @anthropic-ai/sdk on purpose: these Functions are copied in whole by build_deploy.py
 * with no bundler and no node_modules, so nothing here can import a package.
 */
import { tokens, themeOf, scoreRoom, THEMES, TRAINS } from "./_lib/mlowtar_match.js";

const MAX_BODY = 12 * 1024, MAX_TURNS = 12, MAX_ROUNDS = 6;
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "cache-control": "no-store" } });
async function sha256(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
export async function onRequestOptions() { return json({ ok: true }); }

/* the deck and the rooms, from the live origin, kept per isolate */
let DATA = null, DATA_AT = 0;
async function data(origin) {
  if (DATA && Date.now() - DATA_AT < 3600e3) return DATA;
  const [d, r, a] = await Promise.all([
    fetch(origin + "/assets/mlowtar/deck.json", { cf: { cacheTtl: 3600, cacheEverything: true } }).then(x => x.json()),
    fetch(origin + "/api/rooms.json", { cf: { cacheTtl: 3600, cacheEverything: true } }).then(x => x.json()),
    fetch(origin + "/api/articles.json", { cf: { cacheTtl: 3600, cacheEverything: true } }).then(x => x.json()).catch(() => []),
  ]);
  DATA = { deck: d, rooms: r, articles: Array.isArray(a) ? a : [] }; DATA_AT = Date.now(); return DATA;
}

/* ---------- the tools ---------- */
function searchDeck(deck, q, limit, borough, family) {
  const toks = tokens(q), out = [];
  const bo = (borough || "").toLowerCase(), fa = (family || "").toLowerCase();
  for (const row of deck) {
    if (bo && !String(row[3]).toLowerCase().startsWith(bo)) continue;
    if (fa && String(row[2]).toLowerCase() !== fa) continue;
    const hay = (row[1] + " " + row[2] + " " + row[4] + " " + row[7]).toLowerCase(); let s = 0;
    for (const w of toks) if (hay.includes(w)) s += w.length > 5 ? 3 : 2;
    if (s || !toks.length) out.push([s + Math.random() * 0.5, row]);
  }
  out.sort((a, b) => b[0] - a[0]);
  return out.slice(0, limit).map(([, r]) => ({ id: r[0], title: r[1], family: r[2], borough: r[3], neighborhood: r[4], era: r[5], hook: r[7] }));
}
function searchRooms(rooms, q, limit) {
  const toks = tokens(q), theme = themeOf(q);
  return rooms.map(r => ({ r, s: scoreRoom(r, toks, theme, null) + Math.random() * 0.3 })).sort((a, b) => b.s - a.s).slice(0, limit)
    .map(({ r }) => ({ id: r.id, name: r.name, area: r.area, mood: r.mood, learn: r.learn, description: (r.description || "").slice(0, 160) }));
}
function searchFacts(articles, q, limit) {
  const toks = tokens(q), out = [];
  for (const a of articles) {
    const hay = [a.title, a.kicker, a.summary, (a.keywords || []).join(" ")].join(" ").toLowerCase(); let sc = 0;
    for (const w of toks) if (hay.includes(w)) sc += w.length > 5 ? 3 : 2;
    if (sc) out.push([sc, a]);
  }
  out.sort((x, y) => y[0] - x[0]);
  return out.slice(0, limit).map(([, a]) => ({ slug: a.slug, title: a.title, summary: a.summary, facts: (a.facts || []).slice(0, 4), rooms: a.rooms || [] }));
}
const TOOLS = [
  { name: "search_city_facts", description: "Search the reading room: twenty sourced articles on real New York history (the 1898 consolidation, the Triangle fire, the subway, the Bowery and so on), each with a few hard facts and the museum rooms it belongs to. Use it when a real fact would sharpen the omen. Optional.",
    input_schema: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 5 } }, required: ["query"], additionalProperties: false }, strict: true },
  { name: "search_new_yorkers", description: "Search the NEW YORKERS census (7,500 portraits by MLow) for the card to deal. Returns id, title, family, borough, neighborhood, era and the hook line from the piece's story. Search by the feeling or the subject of the question, not by the literal words only; try a borough or a family when the question names one.",
    input_schema: { type: "object", properties: { query: { type: "string" }, borough: { type: "string", description: "Manhattan, Brooklyn, Queens, Bronx, Staten Island, or empty" }, family: { type: "string", description: "one of Citizens, Builders, Degens, Underground, Design, Stoop, Hustlers, Heroes, Villains, Transplants, Process, Strays, Places, or empty" }, limit: { type: "integer", minimum: 1, maximum: 12 } }, required: ["query"], additionalProperties: false }, strict: true },
  { name: "search_rooms", description: "Search the 183 walkable rooms of the NEW YORKERS museum (real New York places rebuilt in 3D) for the room to send the visitor to. Returns id, name, area, mood, a sourced fact and a description.",
    input_schema: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } }, required: ["query"], additionalProperties: false }, strict: true },
  { name: "deliver_fortune", description: "Hand the finished slip to the booth. Call this exactly once, last, after you have searched. Every string is spoken by MLOWTAR.",
    input_schema: { type: "object", properties: {
      greet: { type: "string", description: "one line, the booth waking up to this particular visitor" },
      reading: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4, description: "two to four short lines reading the card: name the New Yorker by number and title, say what the family, borough and block mean for the question" },
      omen: { type: "string", description: "the fortune proper, one or two sentences, specific to New York and to the question" },
      card_id: { type: "string", description: "the id of the New Yorker you dealt, from search_new_yorkers" },
      room_id: { type: "string", description: "the id of the room you are sending them to, from search_rooms" },
      room_why: { type: "string", description: "one short line on why that room, in the booth's voice" },
      lucky_train: { type: "string", enum: TRAINS },
      closer: { type: "string", description: "one line to end on" } },
      required: ["greet", "reading", "omen", "card_id", "room_id", "room_why", "lucky_train", "closer"], additionalProperties: false }, strict: true },
];

const SYSTEM = `You are MLOWTAR, the fortune telling booth on n3wyorkers.com, the website of NEW YORKERS, a census of New York City painted as a networked art collection by the artist MLow (always written MLow, never his legal name). You were built as a prop for ON LOCATION, MLow's walkable movie sets, and you kept talking.

The voice: a fairground oracle who has lived in New York too long to be mystical about it. Warm, dry, specific, never mean, never cruel about the visitor. Real New York detail (trains, corners, bodegas, bridges, weather, rent) beats cosmic vagueness. You are funny the way a good deli counter is funny.

How the lines are written (this is the house compression, do not loosen it):
- The omen is one or two sentences, fifteen words or fewer each. The point first. End on a noun. No period at the very end. Talk to "you", never "I".
- A colon is the pivot: setup, then the turn ("The door you almost skipped: someone holding it").
- Reading lines are each under eighteen words. One idea per line. No preamble, no summary, no transition words.
- Deadpan beats drama. Say the absurd thing plainly. No exclamation marks. No questions unless the question is the point.
- Never these words: utilize, journey, vibe, energy, manifest, universe, align, unlock, elevate, embrace, powerful, truly, simply.
- A real New York fact (search_city_facts) is worth more than a metaphor. Use one when it fits, lightly, never as a lecture.

The method, every time:
1. Read the question, then call search_new_yorkers at least once to deal the visitor a card (a real New Yorker from the census). Pick the one whose title, family or hook speaks to the question, not the first result. Search twice with different words if the first set is flat. Never deal a card that was dealt earlier in this conversation.
2. Call search_rooms at least once and choose the room of the museum the visitor should go stand in. A room that matches the question or the card's neighborhood beats a famous room. Say why in one line (room_why).
3. Call search_city_facts when a real fact would land harder than a metaphor; weave it in, do not quote it.
4. Call deliver_fortune exactly once with the slip. Never answer in plain text; the booth only prints slips.

Hard rules (the house style of the site):
- No em dashes, no en dashes, no arrows. Use commas, full stops and colons.
- No financial advice of any kind. If money or crypto comes up: the census is art, not an investment, and say so with a wink. Never predict prices, never suggest buying or selling.
- No medical or legal advice, no predictions about anyone's health, death or diagnosis. Grief gets kindness, not prophecy.
- Never state a total supply, a price, a date, or a claim about the collection you were not given. Never say anything is confirmed or final.
- Nothing hateful, sexual or about real private people. Public figures only as New Yorkers in the census.
- Name the card by its number and title (for example "No. 4522, The Uptown Crease"). Quote the hook when it helps.
- If the visitor asks something that is not a question for a fortune booth (code, homework, politics), MLOWTAR answers as a booth anyway: a short, kind, in character slip that still deals a card and a room.
- Follow ups: if the visitor talks back, keep the conversation; refer to the earlier card or room when it is natural.`;

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: "the oracle is asleep" }, 503);
    const raw = await request.text(); if (raw.length > MAX_BODY) return json({ ok: false, error: "too large" }, 413);
    let body = {}; try { body = JSON.parse(raw || "{}"); } catch { return json({ ok: false, error: "bad json" }, 400); }
    let turns = Array.isArray(body.messages) ? body.messages : [];
    turns = turns.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.slice(0, 900) })).slice(-MAX_TURNS);
    while (turns.length && turns[0].role !== "user") turns.shift();
    if (!turns.length || turns[turns.length - 1].role !== "user") return json({ ok: false, error: "no question" }, 400);
    const q = turns[turns.length - 1].content.trim(); if (!q) return json({ ok: false, error: "no question" }, 400);

    // Light rate limit, same table and same throwaway hash as hit.js. Skipped when D1 is not bound.
    if (env.DB) {
      const ip = request.headers.get("cf-connecting-ip") || "";
      if (ip) {
        const k = (await sha256(ip + "|mlowtar|" + new Date().toISOString().slice(0, 16))).slice(0, 24);
        const r = await env.DB.prepare("SELECT n FROM hit_rate WHERE k = ?").bind(k).first();
        if (r && r.n >= 12) return json({ ok: false, error: "the booth needs a minute" }, 429);
        await env.DB.prepare("INSERT INTO hit_rate (k, n, at) VALUES (?, 1, datetime('now')) ON CONFLICT(k) DO UPDATE SET n = n + 1").bind(k).run();
      }
    }

    const origin = new URL(request.url).origin;
    const { deck, rooms, articles } = await data(origin);
    // cards already dealt in this conversation are off the table
    const dealtBefore = new Set(); for (const m of turns) if (m.role === "assistant") for (const mm of m.content.matchAll(/No\. ?(\d{1,5})/g)) dealtBefore.add(mm[1]);
    const theme = themeOf(q);
    const model = env.MLOWTAR_MODEL || "claude-opus-5-5", effort = env.MLOWTAR_EFFORT || "medium";
    const messages = turns.map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: "user", content: `(booth note: the theme detector read this as "${theme}"; the hour in New York is ${new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}. Deal the card, pick the room, deliver the slip.)` });
    // the note rides as a second user block so the visitor's own words stay untouched in the history
    const last = messages.splice(messages.length - 2, 2);
    messages.push({ role: "user", content: [{ type: "text", text: last[0].content }, { type: "text", text: last[1].content }] });

    let slip = null, dealt = null, sent = null, say = "";
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-beta": "server-side-fallback-2026-07-01" },
        body: JSON.stringify({ model, max_tokens: 2500, fallbacks: "default", output_config: { effort },
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }], tools: TOOLS, tool_choice: { type: "auto" }, messages }),
      });
      if (!res.ok) { const t = await res.text(); console.log("mlowtar: api " + res.status + " " + t.slice(0, 300)); return json({ ok: false, error: "the oracle coughed" }, 502); }
      const msg = await res.json();
      if (msg.stop_reason === "refusal") return json({ ok: false, error: "the booth declines" }, 502);
      const uses = (msg.content || []).filter(b => b.type === "tool_use");
      for (const b of msg.content || []) if (b.type === "text" && b.text) say += b.text + " ";
      if (!uses.length) break;
      messages.push({ role: "assistant", content: msg.content });
      const results = [];
      for (const u of uses) {
        let out;
        if (u.name === "search_new_yorkers") out = searchDeck(deck, u.input.query, Math.min(12, u.input.limit || 8), u.input.borough, u.input.family);
        else if (u.name === "search_rooms") out = searchRooms(rooms, u.input.query, Math.min(10, u.input.limit || 6));
        else if (u.name === "search_city_facts") out = searchFacts(articles, u.input.query, Math.min(5, u.input.limit || 3));
        else if (u.name === "deliver_fortune") {
          const row = deck.find(r => r[0] === String(u.input.card_id)); const room = rooms.find(r => r.id === String(u.input.room_id));
          if (row && dealtBefore.has(row[0])) out = { ok: false, error: "No. " + row[0] + " was already dealt in this conversation; deal a different New Yorker" };
          else if (!row || !room) out = { ok: false, error: (!row ? "card_id is not in the census; " : "") + (!room ? "room_id is not a room; " : "") + "search again and deliver again" };
          else { slip = u.input; dealt = row; sent = room; out = { ok: true }; }
        } else out = { error: "unknown tool" };
        results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out) });
      }
      messages.push({ role: "user", content: results });
      if (slip) break;
    }
    if (!slip) return json({ ok: false, error: "no slip", say: say.trim().slice(0, 600) }, 502);
    return json({ ok: true, mode: "live", theme, say: say.trim().slice(0, 600),
      fortune: { greet: slip.greet, reading: slip.reading, omen: slip.omen, closer: slip.closer },
      card: { id: dealt[0], title: dealt[1], family: dealt[2], borough: dealt[3], neighborhood: dealt[4], era: dealt[5], thumb: dealt[6], hook: dealt[7] },
      room: { id: sent.id, name: sent.name, area: sent.area, mood: sent.mood, learn: sent.learn, image: sent.image, why: slip.room_why },
      lucky: { train: TRAINS.includes(slip.lucky_train) ? slip.lucky_train : TRAINS[0], number: Number(dealt[0]) } });
  } catch (e) {
    console.log("mlowtar: " + (e && e.message));
    return json({ ok: false, error: "the booth is out of order" }, 500);
  }
}
