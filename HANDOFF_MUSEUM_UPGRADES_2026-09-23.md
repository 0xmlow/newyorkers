# Handoff: the museum room upgrade programme

Written 2026-09-23 at the end of the session that built rooms 142 to 146 and then
began rebuilding the older rooms. Read this first if you are picking the work up.

Everything below is committed in `NEW YORKERS SITE` (a local git repo with **no
remote**; the deploy is the push). Nothing is half finished.

---

## 1. What happened today, in order

1. **Five new rooms, 142 to 146** (`_build/museum/src/rooms/v3.ts`): Arthur Ashe at
   night, the Central Park carousel, Ocean Wonders at the aquarium, Astoria Pool, and
   the tree and the rink at Rockefeller Center. THE MUSEUM went from 141 to 146 rooms.
   Deployed as build `20260923-221527`.
2. **The learnings went into the skill.** `virtual-architect` is now v3.4: cookbook v6
   (`references/new-yorkers-museum.md`) plus a new `references/room-upgrade-guide.md`.
   Packaged in `SKILL UPDATES 2026-09-23/` and copied to the root
   `virtual-architect.skill`. Uploaded to claude.ai on 2026-09-23 as **virtual-architect v2 (current)**, replacing the
   previous version, which stays in the skill's version history. The previous zip is
   also in `_skill_backups_2026-09-23/`.
3. **The upgrade brief was written**:
   `NEW YORKERS SITE/_build/museum/ROOM_UPGRADE_GUIDE_2026-09-23.md`, linked from
   `NEW YORKERS SITE/AGENTS.md`.
4. **Two batches of rebuilds shipped**: `bleachers` and `liberty` (batch one),
   `highline` and `littleisland` (batch two).

## 2. The rule MLow set, and the mechanic that implements it

> "Make sure not to overwrite old files just make new versions."

So: a rebuilt room goes into a **new file** under a **new const name**, keeping its
`id`. `rooms/index.ts` imports the new one instead of the old one. The original stays
exactly where it was and is one import line away from coming back.

```
bleachers      f.ts  ->  bleachers2      rooms/up1.ts
liberty        j.ts  ->  liberty2        rooms/up1.ts
highline       c.ts  ->  highline2       rooms/up2.ts
littleisland   i.ts  ->  littleisland2   rooms/up2.ts
arthuravenue   l.ts  ->  arthuravenue2   rooms/up3.ts
library        d.ts  ->  library2        rooms/up3.ts
apollo         d.ts  ->  apollo2         rooms/up4.ts
carnegie       n.ts  ->  carnegie2       rooms/up4.ts
```

**Ids never change.** They are URLs (`/rooms/<id>`), token identities and thumbnail
filenames.

**The const name must be lowercase letters and digits only.** `_build/rooms_registry.py`
resolves the ROOMS order by matching `\b([a-z0-9]+)\b` against the text of the ROOMS
array. A name like `bleachersV2` matches nothing, the room drops out of `rooms.json`,
and it disappears from the menu, the sitemap and the mint kit without any error.

Next batch goes in `rooms/up5.ts` with names like `mcny2`.

## 3. Where everything is

| Thing | Path |
|---|---|
| The brief | `NEW YORKERS SITE/_build/museum/ROOM_UPGRADE_GUIDE_2026-09-23.md` |
| The running log of rebuilds | `NEW YORKERS SITE/_build/museum/UPGRADE_LOG.md` |
| Rebuilt rooms | `_build/museum/src/rooms/up1.ts`, `up2.ts` |
| Registry | `_build/museum/src/rooms/index.ts` |
| Facts for the eggs | `_build/learn/room_facts_5.json` (rooms 142 to 146) |
| Agent entry point | `NEW YORKERS SITE/AGENTS.md` |
| Skill source | `SKILL UPDATES 2026-09-23/virtual-architect/` |
| Posters and GLBs | `MUSEUM EXPORTS/2026-09-23/` |
| Export runner | `_build/museum/run_export.py` |
| Deploy | `GO LIVE PACKAGE/deploy.sh` (Cloudflare Pages, project `new-yorkers`) |

## 4. The loop for one room

```bash
cd "NEW YORKERS SITE/_build/museum"
node audit_rooms.mjs --room=<id>            # read the faults first
# ... write the rebuild into rooms/up<N>.ts, register it in index.ts ...
npx tsc --noEmit -p tsconfig.json
node audit_rooms.mjs --room=<id>            # must be 0 unreachable 0 backwards 0 stuck
node audit_rooms.mjs --json | ...            # and 0 rescued, which the one line summary hides
node build_variant.mjs up                    # a private bundle, never commit it
python3 shot_room.py <id> a.png --tag up --port 93xx --hour 14 --wait 12
python3 shot_room.py <id> b.png --tag up --port 93xx --at=x,y,z --yaw=-30 --pitch=-6 --wait 12
python3 shot_room.py <id> c.png --tag up --port 93xx --mobile --wait 12
rm -f ../../museum.up.html ../../assets/museum/museum.up.js   # the variant lives at the SITE root
npm run build
```

Then export, thumbs, full build, commit:

```bash
df -h /                                      # a room is about 40 MB of GLB; the disk runs tight
python3 export_server.py 4181 &
python3 run_export.py <idx> <idx> "" <hour>             # idx is 0 based into ROOMS
pkill -f "export_server.py 4181"
python3 ../build_room_thumbs.py
cd ../.. && ./_build/build_all.sh            # must end "no problems"
```

Notes that cost time today:

- `shot_room.py` writes `museum.<tag>.html` and `assets/museum/museum.<tag>.js` at the
  **site root**, not in `_build/museum`. Delete them before a real build; `build_deploy.py`
  refuses to ship preview bundles.
- Screenshots need `--wait 12`; at the default 6 seconds the frames are still black.
- `--at=` needs the equals sign, because a leading minus reads as a flag.
- Yaw 0 looks down −z, 90 toward −x, 180 toward +z.
- The site server on `:4185` and the export receiver on `:4181` must both be up.
- `_build/museum/run_export.py` takes an hour argument; a daylit room exported at the
  real clock gets whatever light New York has right now. It needs `_build/serve.py 4185`
  and `export_server.py 4181` both running.

## 5. The seven faults, all likely to repeat

1. **The mount normal on a circle is `-a - PI/2`, not `PI/2 - a`.** Whole rooms had
   every work facing outward. Suspect anything hung on a curve or in a rotunda.
2. **A wall whose radius changes fast cannot take panels laid square to the radius.**
   They shingle and the neighbour stands in front of the art. Differentiate the radius,
   take the tangent, use `atan2(-tz, tx)` for both the panel and the mount (`wallAt` in
   `up1.ts`).
3. **Masonry modelled as a solid box swallows the room inside it.** The Liberty pedestal
   was one 22 by 26 by 22 box with a stair up the middle. Use `hollowBox` (`up1.ts`).
4. **A crowd of capsules is a million triangles.** The stadium was 1.44 M until the
   spectators became two boxes each, 24 triangles; it is 323 k now and looks the same
   from anywhere a visitor can stand (`boxFigureGeo`).
5. **A room's `spawn` y is the eye, not the floor.** Little Island spawned at 0.9 over a
   floor at 1.1 with an eye of 3, and the visitor arrived under the park looking up
   through the lawn. Write `spawn` as floorY + eye.
6. **A square plane clipped by dropping its outside vertices is a grass cliff** that
   hides what the place stands on. Build the shape the place has: a polar grid over the
   ellipse plus a skirt (`grid` in `up2.ts`).
7. **A path made of stacked boxes on a hill is a staircase.** Sample the line and lay a
   quad strip on the terrain (`terrainStrip` in `up2.ts`).

Also still true from the previous pass: `vertexColors: true` blacks out instance
colours; a moving instanced rig needs `frustumCulled = false`; `k.block` does not
normalise its bounds; `k.sign` clips text wider than 1024 px; `k.water` in daylight is
a mirror until metalness comes down; a slab under a pool hides the pool.

## 6. State of the audit

`node audit_rooms.mjs --json` over all 146 rooms:

| | works only reachable because viewpoint() rescues them |
|---|---|
| before this programme | 527 |
| after batch one | 482 |
| after batch two | 442 |
| after batch three (`arthuravenue`, `library`, in `rooms/up3.ts`) | 407 |
| after batch four (`apollo`, `carnegie`, in `rooms/up4.ts`) | 373 |

Next, in the audit's order: `mcny` (15), `dakota` (14), `snug` (13), `strivers` (13),
`halloffame` (12). Then the facade rooms (most of the institutions 82 to 111, which
stop at the front door), then the ported corridors 1 to 21.

## 7. Open, not done

- The engine work in section 4 of the brief (named sky presets, a neutral ground colour
  in `k.hemi`, more tree species, seated and standing people in the kit, the ambient
  occlusion pass, a bloom clamp, and failing the build on `rescued`) would lift all 146
  rooms at once and has not been started.
- Disk is tight, about 2 GB free. A room export is roughly 40 MB of GLB.
- Older preview bundles from earlier sessions still sit at the site root
  (`museum.a.html`, `museum.b.html` and so on). They are gitignored and excluded from
  the deploy, but they are clutter.
