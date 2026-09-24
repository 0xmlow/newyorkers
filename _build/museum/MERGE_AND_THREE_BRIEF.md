# Brief: the merged Empire State and St. Patrick's, and three rooms from ChatGPT

Written 2026-09-24, after two agents built the same two places independently:
Claude Code in the deploy repo (`src/rooms/v4.ts`, rooms 147 and 148, rich) and
ChatGPT in its downstream Codex copy (`icons2026.ts`, lightweight). MLow asked for
a new version of each that takes the best of both, and for ChatGPT's three other
new places to be integrated.

Read `NEW_ROOMS_147_152_BRIEF.md` first: sections 1 to 4 and 6 (the standard,
the loop, facts, hand back) apply unchanged.

ChatGPT's source, read only, never edit it:
`~/.codex/.chatgpt-projects/g-p-6a6ac4d467dc8191a6b1f94b7eb3c2d0/new-yorkers/site/_build/museum/src/rooms/icons2026.ts`
Its renders: `~/.codex/.chatgpt-projects/g-p-6a6ac4d467dc8191a6b1f94b7eb3c2d0/outputs/gallery-audit-2026-09-24/{empire,stpatricks,palmcourt,chelseamarket,brooklyncentral}.png`
Its reference ledger (official sources it used): `.../new-yorkers/docs/NYC-FIVE-2026-09-24.md`
Claude Code's screenshots: `/private/tmp/claude-501/-Users-degens-Desktop-NEW-YORKERS-BY-MLOW/acc155c1-1cd2-4406-b160-ce1d8e1ab1bb/scratchpad/v4b/` and the posters in `MUSEUM EXPORTS/2026-09-24/new-yorkers-museum-147-*.png`, `-148-*.png`.

## The rule: never overwrite, make new versions

The merged rooms go in a **new file** under **new const names** keeping the ids:
`empirestate2` and `stpatricks2` in `src/rooms/v7.ts`, `id: 'empirestate'` and
`id: 'stpatricks'`. The coordinator has already copied the v4.ts rooms into
v7.ts under those names and registered them in v0.ts; edit v7.ts only. v4.ts
stays untouched.

## What each build does better (the coordinator's reading; check it yourself)

**Claude Code's (keep all of this):** real Midtown out to 8 km with the Chrysler
and landmarks; the mast, the setbacks, the curved fence; the Art Deco lobby
second level; crowds, traffic, boats, helicopter, pigeons; sourced eggs. The
cathedral's full Gothic structure, real stained glass, the rose window over the
organ gallery at the west end, the baldachin, pews with people, 216 flickering
votives, sunlight shafts, Fifth Avenue through the doors.

**ChatGPT's (bring these in):**
1. **The art is the first thing you see.** Its Empire hangs big works (4 by 2.8)
   at eye level on the limestone of the core, so the spawn view is city plus
   art. In Claude Code's spawn view the fence fills the frame and no work is
   visible; its cathedral mounts are small, under the windows. Make the spawn
   view of both rooms show several works clearly, and make the works bigger
   where the architecture allows.
2. **The walk reads as a promenade.** A clear, wide, uncluttered route round the
   terrace and down the nave, and a `path` (the guided tour route, a loop round
   the terrace; the nave aisle to the crossing and back). Check that the guided
   tour works in both rooms and visits the art in order.
3. **The cathedral vault as a continuous shell.** ChatGPT extruded the Gothic
   section (`T.Shape` with two quadratic curves) into one vault surface with ribs
   crossing it, so the ceiling reads as vaulting from anywhere. Compare with
   Claude Code's vault and keep whichever reads better, or combine them.
4. **A lit focal point at the end of the nave.** ChatGPT's rose is lit and
   visible from the spawn. The real rose is at the west end over the entrance,
   which is where Claude Code put it; keep it there, but make sure the view
   from spawn has a lit focal point (the east windows and the baldachin) and
   the reverse view shows the rose glowing.
5. **Restraint.** Its rooms are cheap: 111 to 145 draw calls. Claude Code's
   St. Patrick's crossing is about 610 calls counting the shadow pass. Get both
   merged rooms under about 450 by that same count (merge static geometry per
   material, instance repeated parts, take small things out of the shadow pass)
   without losing what makes them read.

Then look at both rooms with fresh eyes and fix anything else that is weak.
Take before and after shots from the same camera positions.

## The three new places (rooms 153, 154, 155)

ChatGPT's picks, rebuilt to the house standard. MLow has called bare boxes
"terrible" before (the Codex rooms of 2026-09-13 had to be rebuilt), so use
ChatGPT's layout ideas and sources, not its level of finish.

| # | id / const | file | place |
|---|---|---|---|
| 153 | `palmcourt` | `src/rooms/v8.ts` | The Palm Court at the Plaza: the laylight of stained glass overhead (restored 2014 era), the tall palms in planters, trellised walls with mirrors, marble floor, tea tables with white cloths and cane chairs, waiters moving, afternoon tea, a pianist or harpist, Fifth Avenue and the Pulitzer Fountain through the windows. |
| 154 | `chelseamarket` | `src/rooms/v8.ts` | Chelsea Market in the old Nabisco factory: the long brick concourse, the waterfall made from an old pipe, exposed pipes and ducts, reused industrial fittings, iron beams, the stalls and shopfronts, crowds, the clock, the High Line passing over at the Tenth Avenue end. |
| 155 | `brooklyncentral` | `src/rooms/v9.ts` | Brooklyn Public Library Central at Grand Army Plaza: the limestone building shaped like an open book, the tall gilded entrance screen with its figures (render the figures as simple relief forms, not copies), the plaza, the Arch and the fountain across the circle, people on the steps, the lobby inside if you can. |

These are new rooms, registered in `v0.ts` LIVE_ROOMS by the coordinator with
placeholders before you start, like 147 to 152. Replace only the placeholder in
your file. Facts file: `_build/learn/room_facts_10_<yourtag>.json`.
