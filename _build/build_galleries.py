#!/usr/bin/env python3
"""island.html and basement.html: the two standalone walkable galleries as NEW YORKERS pages.

MEME ISLAND (../MEME ISLAND 2026-10-07/) and YOUR MOM'S BASEMENT (../YOUR MOMS BASEMENT 2026-10-08/) are each a
plain three.js r128 site folder in its own repository, with no build step to play: index.html with all the code
inline, vendor/ (three.js, GLTFLoader, meshopt), fonts/ and assets/. They are not museum rooms: the museum engine
is r160 and bundled, these are their own lane, so they ship whole, as MOSH LAB does.

This script copies each gallery's site/ into assets/<slug>/ unchanged (APFS clones, so the disk does not pay for
a second copy), skips the island's hi res sculpture sources (139 MB that the page never loads) and the artifact
fragments, checks the copy (no dash characters, no script or stylesheet from another host, every inline script
parses), writes a 1200x630 share card and a 960x540 home card from one chosen still, and writes the page: the
gallery in a large iframe inside the site shell, with a full screen link and a link to its branch on GitHub.

If a gallery's repository is not on this machine the last copy in assets/<slug>/ stands, so the site still builds
anywhere. Part of build_all.sh, after build_arcade.py and before build_seo.py.
"""
import os, re, sys, json, shutil, hashlib, subprocess
from PIL import Image, ImageDraw, ImageFont
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
URL = cfg()["siteUrl"]
GITHUB = "https://github.com/0xmlow/newyorkers/tree/"
FONT = os.path.join(HERE, "honoraries", "fonts", "IBMPlexMono-Medium.ttf")

GALLERIES = [
    dict(slug="island", page="island.html", nav="ISLAND", branch="meme-island",
         repo=os.path.join(ROOT, "MEME ISLAND 2026-10-07"),
         skip=("assets/sculpt_hi", "assets/sculpts_hi.json", "artifact.html"),
         still=os.path.join("DELIVERABLES", "promo", "meme_island_cover.jpg"),
         tag="MEME ISLAND", name="MEME ISLAND", h1="MEME <em>ISLAND</em>",
         title="MEME ISLAND · a walkable island for The Memes by 6529 and NEW YORKERS",
         desc=("MEME ISLAND, a walkable three.js island by MLow for The Memes by 6529 and NEW YORKERS. Every one of the 527 meme cards hung twice, "
               "on THE FLOOR, a terrazzo mountain stacked by floor price, and in its own district of eighteen. 144 New Yorkers from the crypto eras, "
               "66 of MLow's meme sculptures on plinths, forty residents carrying their portraits, six hidden keys, fifteen typed easter eggs and the "
               "Konami code, a sun and moon that keep New York time, and a Windows 98 desktop to run it from. Free in your browser."),
         controls="WASD walk, SHIFT stride, SPACE jump, drag or arrows to look, E interact, click any card, ENTER to type.",
         phone="MEME ISLAND is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         blurb=("An island for the two collections that live on the same timeline. The Memes by 6529 are hung as a city: eighteen districts, "
                "every card on a terrazzo mountain stacked by floor price, and MLow's 66 meme sculptures on plinths along the colonnade. "
                "Forty New Yorkers from the crypto eras walk the paths carrying their own portraits. Find the six keys, type the words the "
                "island listens for, and watch the sun come down over the harbour at the real New York hour."),
         keywords=["MEME ISLAND", "The Memes by 6529", "6529", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "meme sculptures", "virtual museum"]),
    dict(slug="basement", page="basement.html", nav="BASEMENT", branch="your-moms-basement",
         repo=os.path.join(ROOT, "YOUR MOMS BASEMENT 2026-10-08"),
         skip=("artifact.html",),
         still=os.path.join("DELIVERABLES", "shots_v2", "v2_03_den_tv.jpg"),
         tag="YOUR MOM'S BASEMENT", name="YOUR MOM'S BASEMENT", h1="YOUR MOM'S <em>BASEMENT</em>",
         title="YOUR MOM'S BASEMENT · a walkable Queens basement by MLow",
         desc=("YOUR MOM'S BASEMENT, a walkable three.js basement under a two family house in Queens, by MLow. Eight rooms and five sub rooms behind "
               "doors: the stairs and the window well, the TV den with a mirror onto the wrong room, the card room, the boiler and laundry with the "
               "dryer ride and the 1998 PC, an infinite hallway, a twelve metre everything bagel in a cream cheese lake, the Rat King's court and the "
               "cold room inside the freezer. NEW YORKERS census pieces on every wall, twenty of MLow's meme sculptures as trophies, dozens of "
               "NEW YORKERS 3D props and forty easter eggs. Mom is upstairs. She texts. Free in your browser."),
         controls="WASD walk, SHIFT hurry, SPACE jump, drag or arrows to look, E use, click any piece, ENTER to type, C tour, P postcard.",
         phone="YOUR MOM'S BASEMENT is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         blurb=("A degen dungeon under a two family house in Queens, designed with Astra on FLORA and built dense on purpose: photographic walls, "
                "real props, census New Yorkers hung in every room, twenty meme sculptures on the shelves as trophies, ten of MLow's stickers "
                "turned into objects, and five doors that should not open. Type gm at the stairs, hodl at the dryer, cope at the card table, "
                "and go say hello to the Rat King. Mom is upstairs. She texts."),
         keywords=["YOUR MOM'S BASEMENT", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "Queens", "Rat King", "degen dungeon", "virtual museum"]),
    dict(slug="night", page="night.html", nav="NIGHT", branch="the-marks-night",
         repo=os.path.join(ROOT, "THE MARKS GALLERY 2026-10-09"),
         skip=(), need=("index.html", "assets/gallery.js"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="THE MARKS · ONE NIGHT", name="THE MARKS: One Night in the City", h1="THE MARKS: <em>ONE NIGHT</em>",
         title="THE MARKS · One Night in the City · a walkable gallery by MLow",
         desc=("THE MARKS: One Night in the City, a walkable three.js gallery by MLow for release one of NEW YORKERS. Seven rooms of one New York "
               "night, each opening onto a photograph rebuilt as space: the avenue at 3 a.m., the Uncounted Deli, Uncounted St station, the "
               "Department of the Uncounted, an alley off Canal, the Uncounted Theatre and the roof. 150 of the uncounted and nine era closers on "
               "the walls, every one waking up as you face it. Take a number, ride the turnstile, stamp a census card, lose at three card monte, "
               "and break the seal on the roof. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, 1 to 7 to jump rooms, M for sound.",
         phone="THE MARKS: One Night works on a phone: left thumb walks, right thumb looks, tap anything. A laptop shows it best.",
         blurb=("One night, seven rooms, every label ours. The deli sells EYE CRUNCH and NAZAR COLA, the station is Uncounted St, the census taker "
                "is still counting, and the cat is not for sale. Each room opens onto a photograph turned into depth, so the street, the aisle "
                "and the skyline go on past the walls. 150 of the uncounted hang where New Yorkers would hang them: wheatpasted on plywood, over "
                "the deli shelves, on the platform, on the washing line. The nine era closers have the theatre to themselves. Nobody picks, "
                "not even MLow."),
         keywords=["THE MARKS", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "SuperRare", "blind mint", "bodega", "virtual museum"]),
    dict(slug="movies", page="movies.html", nav="MOVIES", branch="on-location",
         repo=os.path.join(ROOT, "ON LOCATION 2026-10-10"),
         skip=(), need=("index.html", "assets/gallery.js"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="ON LOCATION", name="ON LOCATION: New York at the Movies", h1="ON <em>LOCATION</em>",
         title="ON LOCATION · New York at the Movies · a walkable gallery by MLow",
         desc=("ON LOCATION, a walkable three.js gallery by MLow: a hundred and five scenes New York gave the movies, rebuilt as sets and recast with NEW YORKERS, and a sixty minute escape room on a Queens soundstage. "
               "The mirror in Hell's Kitchen, the floor piano on Fifth Avenue, the grate on Lexington and 52nd, the hottest day in Bed-Stuy, the "
               "firehouse in Tribeca, the rotunda after hours, Coney Island at dawn, the Highbridge step street, breakfast on Fifth Avenue, the "
               "rear window in the Village, the floor in Bay Ridge, the kitchen at the Copa, the crosswalk on Sixth, the table at the deli on Houston "
               "Street, the feast on Mulberry Street, a West Side fire escape, a SoHo loft, the Wall Street floor, the pigeons of Central Park, the "
               "Rockefeller rink, the moon over Brooklyn Heights, a hijacked subway car, the bench at Sutton Place, Liberty's head on the avenue, "
               "the frozen reading room, the bank in Brooklyn, the taxi roofs of West 46th, the line at the cinema, the Unisphere, McMLOW'S in "
               "Queens, the Bramford corridor, the nineteenth floor, the chase under the el, the roof over Times Square, the shouting window, "
               "the 47th Street showroom, the corner at eight a.m., the shop around the corner, the diner with the little saucers, the magic "
               "club, the shot on Washington Street, the stoop on Belmont Avenue, the French toast kitchen, the center for ants, the South Bronx yard, "
               "the ring at the Garden, the Staten Island Ferry, the house on Archer Avenue, the red bar in Little Italy, five flights on West 10th, "
               "a Bed-Stuy brownstone, an empty Times Square, the Gaslight on MacDougal Street, the Grand Central waltz, a basement flat gone dark, a soap studio camera, a bank full of lookalikes, two cerulean belts, a mirror with the wrong swan, a bar of flying bottles, Five Points in the fog, a carpet line that swaps two roommates, a day of shore leave in a minute, the Godfather's table, an office in forced perspective, the Lincoln Center fountain, a wall that moves, the water jug riddle, the bushman's knife, a 14th Street parade, a boat race, a smoke ring billboard, a tango, a mermaid's tank, a SoHo night you cannot leave, a museum shell game, the orange juice pit, Santa's mail, a tree in Brooklyn, the eyes over the valley of ashes, Central Park rollerbladers, two hotel lifts, a mirror with no glass, a clock that stops time, blitz chess in Washington Square, a room being forgotten, a mirror maze, twelve angry men, EMERAC, a crack in the wall, the worst night in Midtown, eight million stories, a flat cleaned by pigeons, a trading floor that thumps on the beat, penguins on Park Avenue, a face swelling at dinner, a bridge across two centuries, a car hanging from a penthouse, a magic act that reads your mind, a breakdance freeze, a daydream on a Himalayan peak, Lady Liberty walking down Fifth and the top of the Empire State "
               "Building. Every member of the cast has an eye flower for a head, every wall holds census New Yorkers from the block where the film "
               "was shot, and every set hides an optical trick. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, Z for binoculars, N or WAY OUT for a line on the floor to the next set, [ and ] for the previous and next set, R for a random set, the set list to jump anywhere, M for sound. <a href=\"assets/movies/?skate\" target=\"_blank\" rel=\"noopener\">SKATE THE SETS ↗</a>: every set is a skate spot with quarter pipes, pyramids, rails and gaps, and three goals; W pushes, SPACE ollies, 1 2 3 flip, A and D spin in the air, C picks your rider from the cast, K switches back to walking, a gamepad works.",
         phone="ON LOCATION works on a phone: left thumb walks, right thumb looks, tap anything. A laptop shows it best.",
         blurb=("The scenes are the films'. The people are ours. Talk to the mirror and your reflection starts running late. Play the floor "
                "piano with your feet, then make a wish and come back big. Stand on the grate until the train lifts you. Walk through the "
                "hydrant. Do not press the button. Do not look away from the skeleton. Climb the step street as long as you like. Find the "
                "ghost in the jeweller's window, watch the courtyard through binoculars, light up the floor in Bay Ridge, let the maitre d' "
                "walk you through the Copa kitchen in one take, and bang on a Checker cab on Sixth Avenue. Then stand on the glass, 102 "
                "stories up, and look down. Further along: stand still and Grand Central waltzes, catch flying bottles, stop the big clock, shout SELL in the orange "
                "juice pit, whistle up the pigeons to clean a flat, and play Lady Liberty a song until she walks down Fifth Avenue. Last door before Kong: THE WRAP, an escape room built the way the New York rooms are built. Sixty minutes on the clock, six puzzles, three tokens for the stage door, a game master on a monitor, and an emergency exit that is never locked."),
         keywords=["ON LOCATION", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "New York movies", "film sets", "optical illusions", "virtual museum"],
         # the films under the gallery, each as HLS + teaser + poster in assets/film/<dir> (encode_film.sh onlocation | skate)
         films=[dict(dir="on-location", kick="Now showing", h="The trailer", dur="2:00", label="ON LOCATION, the trailer, a film by MLow",
                     sub="Two minutes through the sets: the scenes New York gave the movies, rebuilt and recast with NEW YORKERS."),
                dict(dir="skate-the-sets", kick="The music video", h="SKATE THE SETS", dur="0:56", label="SKATE THE SETS, a music video by MLow",
                     sub="Kong clears the Warriors gap at Coney Island. Then the cast skate each other's sets, one bar each, and everybody falls on the drop except Sonny. "
                         "Press K in the gallery, or SKATE THE SETS on the door, and ride it yourself.")]),
    dict(slug="airport", page="airport.html", nav="AIRPORT", branch="mlow-international",
         repo=os.path.join(ROOT, "MLOW INTERNATIONAL WALK 2026-10-09"),
         skip=(), still=os.path.join("site", "assets", "poster.jpg"),
         tag="MLOW INTERNATIONAL", name="MLOW INTERNATIONAL, Terminal B BLOSSOM", h1="MLOW <em>INTERNATIONAL</em>",
         title="MLOW INTERNATIONAL · walk Terminal B BLOSSOM, an airport by MLow",
         desc=("MLOW INTERNATIONAL, Terminal B BLOSSOM: a walkable airport by MLow, built in code in Blender and lit with baked Cycles light. "
               "From the air the terminal reads as the evil eye, a blue glass dome for an iris and seven gate pods as the blossom. Walk the check in "
               "hall, the gallery concourse hung with fLOWers, the gate hub and the apron with MLOW AIR jets. The same airport is room 182 of the "
               "NEW YORKERS museum. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, F to fly, Q and E down and up when flying, 1 to 9 to jump.",
         phone="MLOW INTERNATIONAL is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         blurb=("MLow's airport, landed as a place you can walk. Terminal B is the evil eye from the air and a blossom of seven gates on the ground: "
                "logo check in desks, departure boards that list MLow's collections as destinations, a gallery concourse of fLOWers, a sculpture "
                "garden in the hub, and MLOW AIR on the apron. Every surface is lit with light baked in Cycles, so it looks like the render."),
         keywords=["MLOW INTERNATIONAL", "MLow", "airport", "walkable", "three.js", "Blender", "baked lighting", "evil eye", "BLOSSOM", "virtual architecture"],
         # the hype film under the gallery (encode_film.sh airport): AI finished footage of the same build, scored with Lyria
         films=[dict(dir="mlow-international", kick="Now boarding", h="The film", dur="0:31", label="MLOW INTERNATIONAL, the film, by MLow",
                     sub="Thirty seconds through Terminal B: the drop off at golden hour, in under the dome, the gallery concourse, the seven blossoms "
                         "at the gate, and the eye from the air. The footage is the walkable build above, finished in AI.")]),
    dict(slug="spiral", page="spiral.html", nav="SKELLY CUP", branch="skelly-spiral",
         repo=os.path.join(ROOT, "SKELLY SPIRAL 2026-10-11"),
         skip=(), need=("index.html", "vendor", "assets/data.json"),
         still=os.path.join("DELIVERABLES", "cover.jpg"),
         tag="THE SPIRAL · SKELLY CUP", name="THE SPIRAL: SKELLY CUP", h1="THE <em>SPIRAL</em>",
         title="THE SPIRAL · SKELLY CUP, a walkable marble run tower by MLow on Marble Run by Bryan Brinkman",
         desc=("THE SPIRAL, a walkable three.js marble run tower by MLow for SKELLY CUP, built on Bryan Brinkman's Marble Run. Every tournament "
               "Marble Run has finished is one turn of the ramp, with its 25 races hung in bracket order, heats, semifinals and the final, and the "
               "champion on its own bay with the Champion's Portrait and its marble. 636 race paintings, 26 Champion's Portraits, the 100 census "
               "riders and 98 holder paintings in the paddock, 42 SKELLY CUP trading cards turning in the void, and the commercial on the bodega TV. "
               "Live from marblerun.fun: the top turn is the tournament racing now, and every time a race goes off five marbles come down the gutter "
               "through every run and drop into the cups in the real finishing order. Free in your browser."),
         controls="G marble games, WASD walk, SHIFT stride, drag or arrows to look, E or click a work, R ride the gutter, T pick a run, L Bryan's live feed, 1 2 3 light, M sound.",
         phone="THE SPIRAL works on a phone: left thumb walks, drag to look, tap a work. A laptop shows it best.",
         blurb=("Wright built the Guggenheim as a ramp. A ramp is a marble run. Walk in under the low door, look up through "
                "every tournament Bryan Brinkman's Marble Run has ever finished, one turn each, and climb. Every race painting hangs in bracket "
                "order, every champion has a bay, and the races nobody painted yet hang as wet tape with their seeds. The pennants in the void are "
                "the champions, bottom to top. When a race goes off on marblerun.fun, five marbles drop from the glass at the top and run the "
                "gutter through every run to the cups. Press R and ride one down. Then pick one of Bryan's hundred marbles and play: RINGER on the "
                "void floor, THE DROP from the glass, GUTTER DASH down the whole tower, SKEE in the paddock. Seventeen of Bryan's own works are hidden in "
                "the building, from NimBuds under the dome to five Lost Marbles. Art, not an investment. Not a betting product."),
         keywords=["SKELLY CUP", "THE SPIRAL", "Marble Run", "Bryan Brinkman", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "marble race", "Guggenheim"]),
    dict(slug="momlow", page="momlow.html", nav="MoMLOW", branch="momlow",
         repo=os.path.join(ROOT, "MOMLOW 2026-10-12"),
         skip=(), need=("index.html", "vendor", "js", "assets/data.json", "assets/atlas", "assets/glb"),
         still=os.path.join("DELIVERABLES", "cover.jpg"),
         tag="MoMLOW", name="MoMLOW: The MLow Museum, after MoMA", h1="Mo<em>MLOW</em>",
         title="MoMLOW · The MLow Museum, after MoMA · a walkable museum for NEW YORKERS by MLow",
         desc=("MoMLOW, a walkable three.js museum after MoMA for NEW YORKERS by MLow, on the real MoMA plan: 53rd Street through the lobby to the sculpture "
               "garden, the atrium open to the skylight with Liberty, a sauropod, the Delacorte clock animals and a subway car in it, rings of galleries on "
               "six floors hung by a curator that learned MLow's taste from his own picks and refused every soft painting (1,250 works: the eras by floor, "
               "the five boroughs, the twelve families, the sets, the curator's themes), the glass bridge across the atrium, the escalators and the lift you "
               "ride, the store with his posters, the Bodega cafe, the Moving Pictures on six, cabs with the MLOW topper driving both streets, the sculpture "
               "garden with two reflecting pools, koi, a swan, MLow's eye monument, three blossoms and a Checker cab excavated in bone and calcite, and THE "
               "COUNTED, every collected New Yorker on one 14 metre wall in the order it happened. Day, golden hour and night on the New York clock. Free in your browser."),
         controls="WASD walk, SHIFT hurry, drag or arrows to look, E or click a work, 1 to 9 and 0 to jump (street, lobby, atrium, floors 3 to 6, garden, store, terrace), the same keys ride the lift when you stand in it, C the curator, T time of day, Q settings, M sound.",
         phone="MoMLOW works on a phone: left thumb walks, drag to look, tap a work. A laptop shows it best.",
         blurb=("MLow's first virtual museum was a MoMA for his own collection, with empty frames you filled by hand. This is the real MoMA plan rebuilt "
                "for NEW YORKERS: the lobby runs through the block, the atrium opens to the skylight with Liberty standing in it, the galleries ring the "
                "void floor by floor, and a curator that learned what MLow likes hung every room and refused every soft painting. Press C in any room for "
                "its note. Ride the lift. Cross the bridge. Out back, on the garden's north wall, every New Yorker anyone has collected hangs in the order "
                "it happened. Admission is free. It always was."),
         keywords=["MoMLOW", "MoMA", "MLow", "NEW YORKERS", "walkable museum", "three.js", "3D gallery", "virtual museum", "53rd Street", "sculpture garden", "The Counted"])
]


def cover(path, w, h):
    im = Image.open(path).convert("RGB"); iw, ih = im.size; r = w / h
    if iw / ih > r: nw = round(ih * r); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else: nh = round(iw / r); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)

def tag(im, text, color=(236,201,129), fg=(8,13,22), xy=(22, 22)):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(FONT, 20); tw = d.textlength(text, font=f)
    d.rounded_rectangle((xy[0], xy[1], xy[0] + tw + 28, xy[1] + 40), 8, fill=color)
    d.text((xy[0] + 14, xy[1] + 20), text, font=f, fill=fg, anchor="lm")

def clone(a, b):
    """APFS clone with the mtime kept (the sync compares it); plain copy where cloning is not possible."""
    if subprocess.run(["cp", "-c", "-p", a, b], capture_output=True).returncode != 0: shutil.copy2(a, b)

def sync(src, dst, skip):
    """Copy what is missing or changed (size or mtime), drop what the source no longer has, keep poster.jpg.
    Follows the symlinks a gallery may use to borrow another's assets, so the package carries real files."""
    os.makedirs(dst, exist_ok=True)
    copied = kept = 0
    want = set()
    for root, dirs, files in os.walk(src, followlinks=True):
        rel = os.path.relpath(root, src); rel = "" if rel == "." else rel
        dirs[:] = sorted(d for d in dirs if os.path.join(rel, d).replace("\\", "/") not in skip and not d.startswith("."))
        for f in sorted(files):
            r = os.path.join(rel, f).replace("\\", "/")
            if r in skip or f.startswith("."): continue
            want.add(r)
            a, b = os.path.join(root, f), os.path.join(dst, r)
            os.makedirs(os.path.dirname(b), exist_ok=True)
            if os.path.exists(b) and os.path.getsize(a) == os.path.getsize(b) and int(os.path.getmtime(a)) == int(os.path.getmtime(b)):
                kept += 1; continue
            if os.path.isdir(b): shutil.rmtree(b)
            clone(a, b); copied += 1
    for root, dirs, files in os.walk(dst, topdown=False):
        for f in files:
            r = os.path.relpath(os.path.join(root, f), dst).replace("\\", "/")
            if r not in want and r != "poster.jpg": os.remove(os.path.join(root, f))
        for d in dirs:
            p = os.path.join(root, d)
            if not os.listdir(p): os.rmdir(p)
    return copied, kept

SCRIPT = re.compile(r'<script([^>]*)>([\s\S]*?)</script>', re.I)
TYPE = re.compile(r'''type\s*=\s*["']([^"']+)''', re.I)

def check(dst, slug, need=("index.html", "vendor")):
    """The copy must be clean before it ships: brand dashes, outside code, and every inline script must parse."""
    html = open(os.path.join(dst, "index.html"), encoding="utf-8").read()
    for bad in ("—", "–"):
        if bad in html: raise SystemExit(f"{slug}: a dash character is in index.html; the brand rule forbids it")
    # the code is self hosted: no script or stylesheet from another origin (links out to the card originals are data, and fine)
    stray = [u for u in re.findall(r'''<(?:script|link)[^>]+(?:src|href)\s*=\s*["'](https?://[^"']+)''', html)]
    if stray: raise SystemExit(f"{slug}: index.html loads code from outside the site: {stray[:3]}")
    if shutil.which("node"):
        n = 0
        for attrs, body in SCRIPT.findall(html):
            t = (TYPE.search(attrs) or [None, ""])[1].strip().lower()
            if t not in ("", "module", "text/javascript", "application/javascript") or not body.strip(): continue
            tmp = os.path.join(dst, f".check_{n}.mjs" if t == "module" else f".check_{n}.js"); n += 1
            open(tmp, "w", encoding="utf-8").write(body)
            r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True); os.remove(tmp)
            if r.returncode: raise SystemExit(f"{slug}: inline script {n} does not parse\n" + r.stderr[:800])
    for n in need:
        if not os.path.exists(os.path.join(dst, n)): raise SystemExit(f"{slug}: {n} missing from the copy")
    return html

for G in GALLERIES:
    slug, repo = G["slug"], G["repo"]
    src, dst = os.path.join(repo, "site", G.get("sub", "")).rstrip("/"), os.path.join(SITE, "assets", slug)
    commit = ""
    if os.path.isdir(src):
        r = subprocess.run(["git", "-C", repo, "rev-parse", "--short", "HEAD"], capture_output=True, text=True)
        commit = r.stdout.strip()
        if subprocess.run(["git", "-C", repo, "status", "--porcelain", os.path.join("site", G.get("sub", ""))], capture_output=True, text=True).stdout.strip():
            print(f"  {slug}: NOTE site/ has uncommitted changes; the site gets them, the {G['branch']} branch does not yet")
        copied, kept = sync(src, dst, set(G["skip"]))
        print(f"  {slug}: {copied} files copied, {kept} unchanged, from {os.path.basename(repo)} {commit}")
        still = os.path.join(repo, G["still"])
        if os.path.exists(still):
            cover(still, 1200, 630).save(os.path.join(dst, "poster.jpg"), "JPEG", quality=86, optimize=True, progressive=True)
            im = cover(still, 960, 540); tag(im, G["tag"]); os.makedirs(os.path.join(SITE, "assets", "home"), exist_ok=True)
            im.save(os.path.join(SITE, "assets", "home", f"now-{slug}.jpg"), "JPEG", quality=84, optimize=True, progressive=True)
        else:
            print(f"  {slug}: NOTE still {G['still']} not found; the last poster stands")
    elif not os.path.exists(os.path.join(dst, "index.html")):
        raise SystemExit(f"{slug}: no repository at {repo} and no previous copy in assets/{slug}")
    else:
        print(f"  {slug}: repository not found, keeping the last copy in assets/{slug}")
    if not os.path.exists(os.path.join(dst, "poster.jpg")): raise SystemExit(f"{slug}: no share card at assets/{slug}/poster.jpg")
    html = check(dst, slug, G.get("need", ("index.html", "vendor")))
    # a gallery split into js/ files: the page's version covers them too, and the copied index.html asks for them by that
    # version, or a returning visitor keeps four hours of old script under a new page (the Cloudflare browser cache floor)
    jsdir = os.path.join(dst, "js")
    if os.path.isdir(jsdir):
        h = hashlib.sha256(html.encode("utf-8"))
        for f in sorted(os.listdir(jsdir)):
            if f.endswith(".js"): h.update(open(os.path.join(jsdir, f), "rb").read())
        jv = h.hexdigest()[:10]
        html2 = re.sub(r'(src=["\'])(js/[^"\'?]+\.js)(["\'])', lambda m: f'{m.group(1)}{m.group(2)}?v={jv}{m.group(3)}', html)
        if html2 != html:
            open(os.path.join(dst, "index.html"), "w", encoding="utf-8").write(html2); html = html2
    v = hashlib.sha256(html.encode("utf-8")).hexdigest()[:10]
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(dst) for f in fs)
    img = f"{URL}/assets/{slug}/poster.jpg?v={v}"

    extra_css = """
.gl{max-width:1500px;margin:0 auto;padding:14px 16px 72px;text-align:center}
.gl .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.3em;color:#8FA7AB;text-transform:uppercase}
.gl h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(30px,5vw,48px);margin:8px 0 10px;letter-spacing:.02em}
.gl h1 em{color:#FF2E88;font-style:normal}
.gl p{color:#AAB6C4;line-height:1.6;max-width:640px;margin:0 auto 18px}
.gl .frame{width:100%;height:max(620px,calc(100vh - 190px));margin:0 auto;border:1px solid #223;border-radius:16px;overflow:hidden;
  box-shadow:0 0 60px rgba(70,146,194,.25);background:#080D16}
.gl iframe{width:100%;height:100%;border:0;display:block}
.gl .how{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;color:#8FA7AB;margin-top:18px;line-height:1.8}
.gl .how a{color:#4692C2;text-decoration:none}
.gl .under{margin-top:26px}
.gl .phone{display:none;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;color:#FFD600;margin:0 auto 14px;max-width:520px;line-height:1.7}
@media (max-width:820px){ .gl .phone{display:block} .gl .frame{height:80vh;min-height:520px} }
.gl .films{max-width:1100px;margin:48px auto 0;padding-top:12px}
.gl .film{margin:0 auto 56px}
.gl .film h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(26px,4vw,40px);margin:8px 0 18px;letter-spacing:.02em}
.gl .screen{position:relative;padding:18px;background:#120b07;border-radius:6px;box-shadow:0 0 0 2px #3a2614,0 50px 120px -30px rgba(0,0,0,.95),0 0 80px rgba(255,214,0,.1)}
.gl .bulbs{position:absolute;inset:4px;border-radius:4px;pointer-events:none;background:radial-gradient(circle,#FFD58A 0 2.5px,transparent 3.5px) 0 0/22px 22px;
  -webkit-mask:linear-gradient(#000 0 0) top/100% 10px no-repeat,linear-gradient(#000 0 0) bottom/100% 10px no-repeat,linear-gradient(#000 0 0) left/10px 100% no-repeat,linear-gradient(#000 0 0) right/10px 100% no-repeat;
  mask:linear-gradient(#000 0 0) top/100% 10px no-repeat,linear-gradient(#000 0 0) bottom/100% 10px no-repeat,linear-gradient(#000 0 0) left/10px 100% no-repeat,linear-gradient(#000 0 0) right/10px 100% no-repeat;animation:bulb 1.2s steps(2) infinite}
@keyframes bulb{50%{opacity:.55}}
.gl .scr{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;border-radius:2px}
.gl .scr video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.gl .tr-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:14px;background:#FFD600;color:#111;border:0;border-radius:99px;padding:16px 26px 16px 18px;font:800 13px/1 'Space Grotesk',sans-serif;letter-spacing:.2em;box-shadow:0 18px 50px rgba(0,0,0,.6);transition:transform .25s;cursor:pointer}
.gl .tr-play:hover{transform:translate(-50%,-50%) scale(1.06)}
.gl .tr-play i{width:38px;height:38px;border-radius:50%;background:#111;position:relative;flex:none}
.gl .tr-play i:after{content:"";position:absolute;left:15px;top:11px;border-left:13px solid #FFD600;border-top:8px solid transparent;border-bottom:8px solid transparent}
.gl .tr-play b{font-weight:800;opacity:.6;margin-left:4px}
.gl .tr-play[hidden]{display:none}
.gl .film p{margin-top:22px}
@media (max-width:760px){.gl .screen{padding:10px}.gl .bulbs{display:none}.gl .tr-play{padding:12px 18px 12px 12px;font-size:11px;letter-spacing:.14em}.gl .tr-play i{width:30px;height:30px}.gl .tr-play i:after{left:11px;top:8px;border-left-width:11px;border-top-width:7px;border-bottom-width:7px}}
@media (prefers-reduced-motion:reduce){.gl .bulbs{animation:none}}
"""
    films = ""
    for F in G.get("films", ()):
        fd = os.path.join(SITE, "assets", "film", F["dir"])
        if not all(os.path.exists(os.path.join(fd, x)) for x in ("master.m3u8", "poster.jpg", "teaser.mp4")): raise SystemExit(f"{slug}: assets/film/{F['dir']} is missing master.m3u8, poster.jpg or teaser.mp4; run encode_film.sh")
        films += f"""
  <div class="film" id="film-{F['dir']}">
    <div class="eyebrow">{F['kick']}</div>
    <h2>{F['h']}</h2>
    <div class="screen"><div class="bulbs" aria-hidden="true"></div>
      <div class="scr"><video class="trv" muted loop playsinline preload="none" poster="assets/film/{F['dir']}/poster.jpg" data-teaser="assets/film/{F['dir']}/teaser.mp4" data-src="assets/film/{F['dir']}/master.m3u8" aria-label="{F['label']}"></video>
        <button class="tr-play" type="button" aria-label="Play {F['h']} with sound"><i></i><span>WATCH WITH SOUND <b>{F['dur']}</b></span></button></div>
    </div>
    <p>{F['sub']}</p>
  </div>"""
    films_html = f'\n  <section class="films" id="films">{films}\n  </section>' if films else ""
    # the players: a silent teaser loops on each screen while it is in view; play swaps in the film with sound (HLS, hls.js where the browser has no native HLS)
    scripts_after = "" if not films else """<script>
(function(){
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches, HLS = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js", loading = null;
  function hls(cb){ if (window.Hls) return cb(); if (!loading) { loading = new Promise(function(res, rej){ var sc = document.createElement("script"); sc.src = HLS; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); } loading.then(cb, cb); }
  document.querySelectorAll(".gl .film").forEach(function(box){
    var v = box.querySelector("video.trv"), b = box.querySelector(".tr-play"); if (!v || !b) return; var full = false, SRC = v.dataset.src;
    if (!RM && "IntersectionObserver" in window) { var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (full) return; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.teaser; v.play().catch(function(){}); } else v.pause(); }); }, {threshold: .35}); io.observe(v); }
    function go(){ b.hidden = true; v.controls = true; v.muted = false; v.loop = false; v.currentTime = 0; v.play().catch(function(){}); }
    b.addEventListener("click", function(){ full = true; v.pause();
      document.querySelectorAll(".gl .film video.trv").forEach(function(o){ if (o !== v && !o.paused && !o.muted) o.pause(); });
      if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = SRC; go(); return; }
      hls(function(){ if (window.Hls && Hls.isSupported()) { var h = new Hls({capLevelToPlayerSize: true}); h.loadSource(SRC); h.attachMedia(v); h.on(Hls.Events.MANIFEST_PARSED, go); } else { v.src = SRC; go(); } });
    });
  });
})();
</script>"""
    body = f"""<main class="gl">
  <div class="phone">{G['phone']}</div>
  <div class="frame"><iframe id="glFrame" src="assets/{slug}/?v={v}" title="{G['name']} by MLow" allow="fullscreen; autoplay; clipboard-write" loading="eager"></iframe></div>
  <div class="how">{G['controls']}<br><a href="assets/{slug}/?v={v}" target="_blank" rel="noopener">Open full screen</a> &nbsp;·&nbsp; <a href="{GITHUB}{G['branch']}" target="_blank" rel="noopener">The code</a></div>
  <div class="under">
    <div class="eyebrow">A walkable gallery by MLow</div>
    <h1>{G['h1']}</h1>
    <p>{G['blurb']}</p>
  </div>{films_html}
</main>"""
    jsonld = {"@context": "https://schema.org", "@type": "WebApplication", "@id": f"{URL}/{slug}",
              "name": G["name"], "url": f"{URL}/{slug}", "description": G["desc"],
              "author": {"@type": "Person", "name": "MLow"}, "applicationCategory": "EntertainmentApplication",
              "operatingSystem": "Web browser", "isAccessibleForFree": True,
              "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
              "image": img, "codeRepository": GITHUB + G["branch"], "isPartOf": {"@id": URL + "/#site"}}
    page = shell(title=G["title"], description=G["desc"], body=body, path=G["page"], active=G["nav"],
                 extra_css=extra_css, jsonld=jsonld, image=img, keywords=G["keywords"], scripts_after=scripts_after)
    open(os.path.join(SITE, G["page"]), "w", encoding="utf-8").write(page)
    print(f"{G['page']}: {G['name']} {size / 1e6:.0f} MB in assets/{slug} from {os.path.basename(repo)} {commit or '(last copy)'}, scripts parse, v={v}")
