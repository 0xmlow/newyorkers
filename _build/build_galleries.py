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
# every gallery gets this first, before its engine: on a phone it halves any image texture over the cap at upload, so no
# gallery outgrows the memory iOS gives a tab (MoMLOW crashed phones at 1.1 GB). A gallery's gpu= sets the cap and which
# image URLs are the art and keep more detail. See HANDOFF_PHONE_2026-10-18.md.
PHONE_GPU = os.path.join(SITE, "assets", "ui", "phone-gpu.js")

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
         keywords=["THE MARKS", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "SuperRare", "instant reveal", "bodega", "virtual museum"]),
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
    dict(slug="gardens", page="gardens.html", nav="GARDENS", branch="mlow-gardens",
         repo=os.path.join(ROOT, "MLOW GARDENS WALK 2026-10-15"),
         skip=(), still=os.path.join("site", "assets", "poster.jpg"),
         tag="MLOW GARDENS", name="MLOW GARDENS", h1="MLOW <em>GARDENS</em>",
         title="MLOW GARDENS · an amusement park by MLow, hung with Coney Island",
         desc=("MLOW GARDENS, a walkable amusement park by MLow, built in code in Blender. Ten roller coasters, the BLOSSOM GP circuit "
               "whose plan is the evil eye, a ferris wheel that is an eye, and 179 NEW YORKERS on the walls: every Coney Island New Yorker "
               "hung along the boardwalk in the order they were made, and the parks of New York in LUNA HALL, a ribbed glass gallery named "
               "for Luna Park's Million Lights. Ride the coasters, ride along on the circuit. Free in your browser."),
         controls="WASD walk, SHIFT run, mouse to look, E to see the piece you are looking at, R to ride, F to fly, 1 to 9 to jump.",
         phone="MLOW GARDENS is built for a keyboard and a big screen. It opens on a phone, but a laptop is where it sings.",
         tagline="Ride the coasters: stay for Coney Island",
         blurb=("An amusement park built in code, hung with New Yorkers. Every Coney Island piece lines the boardwalk, in the order it "
                "was made. The parks of New York fill LUNA HALL. Ride the front car. Watch the race from the back of the pack. Ten "
                "coasters. One eye. Zero tickets."),
         # shots under the description: files inside the walk repo's site/, so they ship with the copy
         shots=[("assets/shots/boardwalk.jpg", "The boardwalk: Coney Island, in the order it was made"),
                ("assets/shots/coney-island.jpg", "Coney Island, hung where it belongs"),
                ("assets/shots/luna-hall.jpg", "LUNA HALL: the parks of New York, under glass"),
                ("assets/shots/eye-wheel.jpg", "The ferris wheel is the eye"),
                ("assets/shots/first-drop.jpg", "The first drop, from the front car"),
                ("assets/shots/eye-circuit.jpg", "From the air: the racetrack is the logo"),
                ("assets/shots/plaza.jpg", "The logo is the floor"),
                ("assets/shots/gate.jpg", "Walk in: the first New Yorker you meet is Nathan's Famous"),
                ("assets/shots/aerial.jpg", "Ten coasters. One eye. Zero tickets")],
         keywords=["MLOW GARDENS", "MLow", "NEW YORKERS", "Coney Island", "amusement park", "roller coaster", "walkable gallery", "three.js", "Blender", "virtual architecture"]),
    dict(slug="bodega", page="bodega.html", nav="BODEGA", branch="last-bodega",
         repo=os.path.join(ROOT, "LAST BODEGA WALK 2026-10-15"),
         skip=(), need=("index.html", "vendor", "app.js", "expansion.js", "assets/expanded-art.json"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="THE LAST BODEGA", name="THE LAST BODEGA IN THE UNIVERSE", h1="THE LAST <em>BODEGA</em>",
         title="THE LAST BODEGA IN THE UNIVERSE · a walkable bodega at the end of everything, by MLow",
         desc=("THE LAST BODEGA IN THE UNIVERSE, a walkable three.js bodega by MLow. The stars went out and the coffee is still a dollar. "
               "Walk the shop, then the five places behind it: the freezer archive, the Midnight Laundromat, the Office of Lost Letters "
               "and the Garden of the Next Universe on the roof. 44 NEW YORKERS hung in the rooms they belong to, shelves stocked with "
               "labels made from the collection, an immortal cat, forty secrets, and three brass tokens that bring back the sun. Free in your browser."),
         controls="WASD or arrows walk, drag to look, Q and R turn, click or E on anything, the Rooms button jumps between the five places.",
         phone="THE LAST BODEGA works on a phone: the arrows walk, drag to look, tap anything. A laptop shows it best.",
         tagline="The stars went out: the coffee is still a dollar",
         blurb=("A corner store at the end of the universe, still open. The shelves are stocked with New Yorkers. The freezer opens onto "
                "an archive. Behind the shop: a laundromat that washes yesterday, a post office for letters that never arrived, and a roof "
                "garden where somebody is growing the next universe. Forty secrets. Three brass words. One immortal cat."),
         shots=[("assets/shots/shop.jpg", "The shop: the shelves are stocked with New Yorkers"),
                ("assets/shots/archive.jpg", "Through the freezer: the things we kept"),
                ("assets/shots/laundromat.jpg", "The Midnight Laundromat: wash yesterday, keep the change"),
                ("assets/shots/lost-letters.jpg", "The Office of Lost Letters: forwarding address unknown"),
                ("assets/shots/garden.jpg", "The roof: somebody has to water tomorrow")],
         keywords=["THE LAST BODEGA", "bodega", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "3D gallery", "easter eggs", "virtual museum", "New York"]),
    dict(slug="gentrifying", page="gentrifying.html", nav="GENTRIFYING", branch="gentrifying-museum",
         repo=os.path.join(ROOT, "GENTRIFYING MUSEUM WALK 2026-10-15"),
         skip=(), need=("index.html", "vendor", "app.js", "installations.js", "materials.js", "atmosphere.js", "assets/art.json"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="THE GENTRIFYING MUSEUM", name="THE MUSEUM THAT IS GENTRIFYING ITSELF", h1="THE MUSEUM THAT IS <em>GENTRIFYING ITSELF</em>",
         title="THE MUSEUM THAT IS GENTRIFYING ITSELF · a walkable loft gallery that sells itself while you watch, by MLow",
         desc=("THE MUSEUM THAT IS GENTRIFYING ITSELF, a walkable three.js gallery by MLow. A working artists' loft in New York with 58 NEW YORKERS "
               "on its brick. Generate a little buzz and watch it turn into luxury real estate: the brick is painted white, a branded wall pushes "
               "the art into a corridor, the asking rent climbs, and the developer's name is painted across the whole room. Seven optical "
               "illusions, six tenant records, one cooperative ending. Free in your browser."),
         controls="WASD or arrows walk, drag to look, Q and R turn, click or E on anything. Generate buzz to redevelop the building; Optical studies takes you to each illusion's viewing point.",
         phone="THE GENTRIFYING MUSEUM works on a phone: the arrows walk, drag to look, tap anything. A laptop shows it best.",
         tagline="First the artists. Then the amenities",
         blurb=("A loft where twelve artists signed one lease. Every bit of buzz makes the building more desirable and gives the art less room. "
                "The sales suite sells the paintings with the penthouse. The holdouts keep everything that was moved downstairs. Find the six "
                "tenant records, call the assembly on the roof, and take the building back."),
         shots=[("assets/shots/working-floor.jpg", "The working floor: twelve artists, one lease"),
                ("assets/shots/the-rebrand.jpg", "The Rebrand: flat letters, from the door"),
                ("assets/shots/the-rebrand-broken.jpg", "One step to the side: the brand breaks into the building"),
                ("assets/shots/the-corridor.jpg", "The art, moved to a corridor"),
                ("assets/shots/the-hang.jpg", "Every New Yorker lit like it matters"),
                ("assets/shots/sales-suite.jpg", "The sales suite: art included with the penthouse"),
                ("assets/shots/bottomless-value.jpg", "Bottomless Value: the floor is glass"),
                ("assets/shots/the-holdouts.jpg", "The holdouts: everything they moved, floor to pipes"),
                ("assets/shots/the-commons.jpg", "The cooperative ending: the brick comes back")],
         keywords=["THE MUSEUM THAT IS GENTRIFYING ITSELF", "gentrification", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "optical illusion", "anamorphic", "virtual museum", "New York loft"]),
    dict(slug="unreal", page="unreal.html", nav="UNREAL ESTATE", branch="unreal-estate",
         repo=os.path.join(ROOT, "UNREAL ESTATE WALK 2026-10-17"),
         skip=(), need=("index.html", "js", "art.json", "art", "fonts"),
         still=os.path.join("public", "shots", "bagel.jpg"),
         tag="UNREAL ESTATE", name="DEPARTMENT OF UNREAL ESTATE", h1="DEPARTMENT OF <em>UNREAL ESTATE</em>",
         title="DEPARTMENT OF UNREAL ESTATE · a walkable SoHo loft where reality is rent stabilized, by MLow",
         desc=("DEPARTMENT OF UNREAL ESTATE, a walkable three.js gallery by MLow. A fictional cast iron loft in SoHo with four optical "
               "installations: a monumental everything bagel, a 900 square foot studio that goes on forever, an anamorphic ring that only "
               "closes from one spot on the floor, and a moire commute that changes as you walk. 48 New Yorkers about rent, roommates, "
               "moving day and the building, in four sets of twelve. Free in your browser."),
         controls="WASD or arrows walk, drag to look, click the floor to walk there, click any work. Look again takes you to each installation's viewing point.",
         phone="DEPARTMENT OF UNREAL ESTATE works on a phone: the arrows walk, drag to look, tap anything. A laptop shows it best.",
         tagline="Reality is rent stabilized",
         blurb=("A loft that cost more than it looks. The bagel on the plinth includes your security deposit. The studio at the back is "
                "seven metres deep and reads as forty. Stand on the yellow ring and the pieces in the air close into one circle; take a "
                "step and it breaks. Sit on the bench at the back and watch the commute move while you do not. Four sets of twelve New "
                "Yorkers hang in the bays: the listing, the move, the building and the unreal."),
         shots=[("shots/entrance.jpg", "The loft from the door"),
                ("shots/bagel.jpg", "01 The everything bagel"),
                ("shots/studio.jpg", "02 The 900 square foot studio"),
                ("shots/circle.jpg", "03 Circle back, from the yellow ring"),
                ("shots/commute.jpg", "04 The commute")],
         keywords=["DEPARTMENT OF UNREAL ESTATE", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "optical illusion", "anamorphic", "moire", "SoHo loft", "everything bagel"]),
    dict(slug="inside", page="inside.html", nav="INSIDE", branch="bigger-on-the-inside",
         repo=os.path.join(ROOT, "BIGGER ON THE INSIDE 2026-10-17"),
         skip=(), need=("index.html", "js", "manifest.json", "glb", "plates", "art"),
         still=os.path.join("public", "shots", "block.jpg"),
         tag="BIGGER ON THE INSIDE", name="BIGGER ON THE INSIDE", h1="BIGGER ON <em>THE INSIDE</em>",
         title="BIGGER ON THE INSIDE · one New York block where every door opens onto a room too big for it, by MLow",
         desc=("BIGGER ON THE INSIDE, a walkable three.js gallery by MLow. One Lower East Side block at night where every door is a live "
               "portal into a room far bigger than its building: a bodega aisle a mile deep, a walk-up where every floor is the fifth "
               "and the paintings change as you climb, a 900 square foot studio built as an Ames room, a laundromat whose dryers look "
               "into the other rooms, a subway car that rolls all the way round you, and a roof where the city folds over the sky. "
               "Walk off either end of the street and you walk back in at the other. 166 New Yorkers, MLow's posters and stickers, "
               "and an Eye Flower that watches the whole block. Free in your browser."),
         controls="WASD or arrows walk, drag to look, click the floor to walk there, click any work. Doors are real: walk through them. Rooms jumps anywhere.",
         phone="BIGGER ON THE INSIDE works on a phone: the arrows walk, drag to look, tap anything. A laptop with a good graphics chip shows it best.",
         tagline="Space is the one luxury in New York. Online it is free",
         blurb=("New York has everything except room. So here is one block with more of it than the buildings could ever hold. The "
                "bodega has one aisle and it goes back about a mile. The walk-up only goes up, and every landing is the fifth floor. "
                "Apartment 5A is nine hundred square feet and looks it from exactly one spot. The dryers at the laundromat look into "
                "the other rooms, and the big one at the back is a tunnel. The train rolls, the riders do not mind, and on the roof "
                "the city keeps going, up and over your head. Walk off the end of the street and you are back at the start."),
         shots=[("shots/block.jpg", "The block: every door is a portal"),
                ("shots/flower.jpg", "The Eye Flower over the street, and the street again through the corner"),
                ("shots/hoarding.jpg", "Post no bills: posters, stickers and New Yorkers on the hoarding"),
                ("shots/bodega.jpg", "Infinity Deli: one aisle, about a mile"),
                ("shots/walkup.jpg", "5 Eldridge: up the well, every floor the fifth"),
                ("shots/studio.jpg", "Apartment 5A, from the peephole: an Ames room"),
                ("shots/dryers.jpg", "Suds and Space: each dryer looks into another room, live"),
                ("shots/drum.jpg", "The big one: a drum that turns round a still bridge"),
                ("shots/train.jpg", "Bigger on the Inside St: the car rolls, you do not"),
                ("shots/fold.jpg", "Tar beach: the city folds over the sky")],
         keywords=["BIGGER ON THE INSIDE", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "optical illusion", "portal", "Ames room", "non Euclidean", "New York block"]),
    dict(slug="breakglass", page="breakglass.html", nav="BREAK GLASS", branch="break-glass",
         eyebrow="The grail . a NEW YORKERS 1/1 by MLow",
         collect=dict(url="https://superrare.com/artwork/eth/0x2DBFCcA230979a91863BE63EBcE55dD5AaE2B5C9/51", where="SuperRare",
                      kicker="The grail . 1 of 1", h="There is only one. It is available.",
                      price=[("Buy now", "1.4269 ETH"), ("Or bid, reserve", "1 ETH")],
                      p="IN CASE OF EMERGENCY: BREAK GLASS is a single token: one case, one owner, all 111 Keystone New Yorkers and their 163 painted states inside it. It is listed now on SuperRare."),
         repo=os.path.join(ROOT, "BREAK GLASS 1 OF 1 2026-10-15"),
         skip=(), need=("index.html",),
         still="PREVIEW.png",
         tag="BREAK GLASS · 1/1", name="BREAK GLASS", h1="BREAK <em>GLASS</em>",
         title="BREAK GLASS · a NEW YORKERS 1/1 by MLow: break the case, meet a Keystone New Yorker",
         desc=("BREAK GLASS, a three.js 1/1 by MLow. A blue emergency case covered in evil eyes that watch you back, on a white terrazzo plinth behind velvet ropes. Take the hammer off its "
               "chain, hit the glass three times, and it shatters to show one of the Keystone 111, pulled at random from 163 painted states. "
               "Press RE-ARM on the plinth and every shard flies back into the frame for another pull. Canal Street Bootlegs are the rarest. Free in your browser."),
         controls="Click the glass three times. Drag to walk round the stand, scroll to zoom. RE-ARM, TURN and SOUND are the buttons on the plinth. SPACE strikes, R re-arms, B turns it, M mutes.",
         phone="BREAK GLASS works on a phone: tap the glass three times, then the buttons on the plinth.",
         tagline="In case of emergency. A New Yorker is waiting",
         blurb=("Every fire cabinet in the city holds the same thing. This one holds a New Yorker. The enamel is evil eye blue and every eye on it "
                "follows the hammer. Break the glass and one of the 111 Keystone works slides forward, the siren spins and the bell rings. "
                "Turn the case around for the inspection tag. Last checked: never."),
         films=[dict(dir="break-glass", kick="The film", h="BREAK GLASS", dur="0:44", label="BREAK GLASS, the hype film, by MLow",
                     sub="Shot inside the piece itself, frame by frame: the eyes, the hammer, three hits, the glass in slow motion, seven pulls and the rarest one. The score is made in code too.")],
         keywords=["BREAK GLASS", "MLow", "NEW YORKERS", "Keystone 111", "1/1", "three.js", "evil eye", "interactive art", "NFT", "generative reveal"]),
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
         gpu=dict(art=r"/atlas/|/t/"),
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
         keywords=["MoMLOW", "MoMA", "MLow", "NEW YORKERS", "walkable museum", "three.js", "3D gallery", "virtual museum", "53rd Street", "sculpture garden", "The Counted"]),
    dict(slug="pigeonhole", page="pigeonhole.html", nav="PIGEONHOLE", branch="the-pigeonhole",
         repo=os.path.join(ROOT, "DOWN THE PIGEONHOLE 2026-10-17"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/art", "assets/glb", "assets/stickers"),
         still=os.path.join("shots", "diorama.jpg"),
         tag="THE PIGEONHOLE", name="THE PIGEONHOLE", h1="THE <em>PIGEONHOLE</em>",
         title="THE PIGEONHOLE · a museum inside a pigeon inside a bodega inside a dream, a walkable exhibition by MLow",
         desc=("THE PIGEONHOLE, a walkable three.js exhibition by MLow for NEW YORKERS. Twelve rooms at four scales, each inside something in "
               "the room before it: the last N train at 3:33 a.m. whose car repeats forever, a platform where a pigeon grows nine metres tall, a "
               "Jackson Heights bodega whose cooler doors open onto Rockaway and the harbour, a stockroom stair that only goes down, and the "
               "pigeon on the counter whose eye you fall into. Inside her: a breathing feather cathedral, a gallery of everything she ever ate, "
               "an opera house heart with your pulse, a wing where gravity follows the wall, a planetarium map where 40 New Yorkers pop up at "
               "their neighbourhoods, the Museum of Modern Pigeon with the bodega live in a glass case, and a gift shop of snow globes that hold "
               "every room. 190 New Yorkers, MLow's stickers on every surface. Free in your browser."),
         controls="WASD or arrows walk, mouse or drag to look, click anything, I for the index of every piece, [ and ] change rooms, M sound.",
         phone="THE PIGEONHOLE works on a phone: left thumb walks, right thumb looks, tap anything. A laptop with a good graphics chip shows it best.",
         tagline="The smallest thing in the room holds the biggest world",
         # the spot under the gallery (add_media.py the-pigeonhole; also leads media.html)
         films=[dict(dir="the-pigeonhole", kick="The spot", h="Look her in the eye", dur="1:00", label="THE PIGEONHOLE, the spot, a film by MLow",
                     sub="Every bodega has a pigeon. Nobody looked her in the eye. One minute shot entirely inside the exhibition: into her eye on the drop, "
                         "a museum inside a pigeon inside a bodega inside a dream, out through the snow globe and back on the N.")],
         blurb=("You fell asleep on the N. The car is crossing the sky and its end doors open onto the same car, again and again. On the third "
                "car the doors open on a platform that should not exist, and the platform opens on a bodega that is open 25 hours. There is a "
                "pigeon on the counter. Look into her eye. Inside the pigeon is a cathedral, a lost and found, a heart that keeps your time, a "
                "wing that turns you upside down and a brain that knows the way home. At the very centre is a museum, and in its glass case is "
                "the bodega you just left, live, with you in it, very small. Exit through the gift shop. The big snow globe holds the train."),
         shots=[("shots/car.jpg", "Last Stop, 3:33 A.M.: every car is this one"),
                ("shots/giant.jpg", "The Platform of Wrong Sizes: the pigeon grows as you walk to it"),
                ("shots/bodega.jpg", "Pigeonhole Deli Grocery: one eye, from one sticker on the floor"),
                ("shots/eye.jpg", "The pigeon on the counter. Her eye is a door"),
                ("shots/cooler.jpg", "The Cooler: thirty metres of aisle, every door somewhere else"),
                ("shots/nave.jpg", "The Nave: the neck is a cathedral, and it breathes"),
                ("shots/crop.jpg", "Lost and Found: the reverse magnifier"),
                ("shots/heart.jpg", "The Heart: an opera house that keeps your pulse"),
                ("shots/wing.jpg", "Hall of Flight: down is wherever your feet are"),
                ("shots/dome.jpg", "The Homing Dome: the city stands up to meet you"),
                ("shots/diorama.jpg", "The Museum of Modern Pigeon: the bodega, live, in a glass case"),
                ("shots/itself.jpg", "The Collection of Itself: the painting holds the room that holds it"),
                ("shots/shop.jpg", "The Gift Shop: every snow globe is a room of the show")],
         keywords=["THE PIGEONHOLE", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "optical illusion", "portal", "recursive", "bodega", "pigeon", "anamorphic", "virtual museum"]),
    dict(slug="unlicensed", page="unlicensed.html", nav="UNLICENSED", branch="unlicensed-new-york",
         repo=os.path.join(ROOT, "UNLICENSED NEW YORK 2026-10-18"),
         skip=(), need=("index.html", "collection.html", "assets/data.js", "assets/art", "assets/glb", "assets/stickers", "assets/generated"),
         still=os.path.join("site", "shots", "sky.jpg"),
         tag="UNLICENSED NEW YORK", name="UNLICENSED NEW YORK", h1="UNLICENSED <em>NEW YORK</em>",
         title="UNLICENSED NEW YORK · the department that impounded the impossible parts of the city, a walkable exhibition by MLow",
         desc=("UNLICENSED NEW YORK, a walkable three.js exhibition by MLow for NEW YORKERS: a fictional municipal building that has "
               "impounded the impossible parts of New York. Sixteen departments in a cycle: take a number at the Bureau of Unlicensed Miracles, "
               "stand trial before a jury of pigeons, step into an apartment that is bigger than its lease, open a deli refrigerator that holds "
               "a whole rooftop, wash gravity, open your emotional baggage, repeat your appeal down a hallway four levels deep, fold the "
               "borough overhead, watch the city sink into its own reflection, chase a bench that will not be sat on, play an organ made of "
               "noise complaints, assemble a witness out of 196 fragments, find the actual museum live inside a landlord's coat pocket, see "
               "a painting that holds the room that holds it, give a rooftop back to the block, and fill in your exit interview. "
               "160 New Yorkers on the walls, 43 things to find, four generated plates. Free in your browser."),
         controls="WASD or arrows walk, mouse or drag to look, click anything, E interacts, I for the index of every piece, [ and ] change rooms, Escape closes a card.",
         phone="UNLICENSED NEW YORK works on a phone: left thumb walks, right thumb looks, tap anything. A laptop with a good graphics chip shows it best.",
         tagline="Your application will be processed yesterday",
         blurb=("Somewhere in the city there is a building that handles the parts of New York that do not fit on the form. Apply for a "
                "miracle at the intake counter. Appeal your rent to a jury of pigeons. Stand on the brass eye in an apartment that is bigger "
                "than its lease. Enter a universe through a deli refrigerator. Wash gravity. Open a suitcase that has a whole neighbourhood "
                "packed in it. Walk down a hallway of appeals that opens on the same hallway, four deep. Click a water tower and the borough "
                "folds over your head. Chase a bench. Play the noise. Walk onto an eye and watch 196 scattered pieces become one witness. "
                "In the landlord's coat pocket is the actual museum, live, at one to seven. Then the exit interview, where you are approved "
                "to remain impossible, and the form sends you back to the start."),
         shots=[("shots/intake.jpg", "The Bureau of Unlicensed Miracles: take a number, the number is taking you"),
                ("shots/jury.jpg", "The International Court of Pigeon Justice: the jury has reviewed your sidewalk privileges"),
                ("shots/rent.jpg", "The Apartment Bigger Than Its Lease: stand on the brass eye"),
                ("shots/deli.jpg", "The Last Bodega in the Universe: the refrigerator contains a city"),
                ("shots/wash.jpg", "The Gravity Laundromat: the room turns, you do not"),
                ("shots/lost.jpg", "Emotional Baggage Claim: every suitcase is a door"),
                ("shots/appeals.jpg", "The Endless Appeals Office: the hallway opens on itself, four levels deep"),
                ("shots/sky.jpg", "The Sky Is Under Renovation: click the water tower and the borough folds overhead"),
                ("shots/flood.jpg", "The Department of Liquid Assets: the city sinking into its own reflection"),
                ("shots/bench.jpg", "The Central Park of Forbidden Benches: it has somewhere else to be"),
                ("shots/noise.jpg", "The Cathedral of Noise Complaints: an organ of architecture"),
                ("shots/archive.jpg", "The Archive of Unfinished New Yorkers: 196 fragments, one witness"),
                ("shots/pocket.jpg", "The Landlord's Coat Pocket: the actual museum, live, at one to seven"),
                ("shots/review.jpg", "The Museum Inside Its Own Review: the painting holds the room that holds it"),
                ("shots/garden.jpg", "The Rooftop That Refused to Be Luxury: the flower watches the city"),
                ("shots/release.jpg", "The Exit Interview With New York: approved to remain impossible")],
         keywords=["UNLICENSED NEW YORK", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "optical illusion", "portal", "recursive", "anamorphic", "forced perspective", "pigeon", "bodega", "virtual museum"]),
    dict(slug="records", page="records.html", nav="RECORDS", branch="on-record",
         repo=os.path.join(ROOT, "ON RECORD 2026-10-20"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/plates", "assets/glb"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="ON RECORD", name="ON RECORD: New York on Wax", h1="ON <em>RECORD</em>",
         title="ON RECORD · New York on Wax · a walkable gallery by MLow",
         desc=("ON RECORD, a walkable three.js gallery by MLow, the sister of ON LOCATION: eleven rooms where New York made its music, rebuilt "
               "and recast with NEW YORKERS. A record store where the floor is a turntable, Jones Street in the snow in 1963, the die cut tenement "
               "on St. Marks Place, the corner of Ludlow and Rivington, the silver loft on East 47th Street, 315 Bowery, the rec room at 1520 "
               "Sedgwick Avenue where the break was born, the stoop on East 126th Street where fifty seven musicians posed for one picture, the "
               "wedge shaped basement at 178 Seventh Avenue South, Amateur Night at 253 West 125th Street and the Chelsea Hotel. Every room plays "
               "its own song, written note by note in your browser, every member of the cast has an eye flower for a head, every wall holds census "
               "New Yorkers from the block, and every room hides a trick. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, Z for binoculars, N or WAY OUT for a line on the floor to the next room, [ and ] for the previous and next room, R for a random room, K to skate.",
         phone="ON RECORD works on a phone: left thumb walks, right thumb looks, tap anything. Turn the sound on: every room has its own song.",
         tagline="Drop the needle anywhere",
         blurb=("The streets, the stoops and the clubs are New York's. The records belong to the people who made them. The people are ours. "
                "Step onto the turntable in the record store and the whole shop turns round you. Stand on the photographer's mark on Jones Street "
                "and the snow stops for a square picture, then walk on and somebody takes your arm. Walk left and right in front of the tenement on "
                "St. Marks Place and the tenants change. Chop the corner of Ludlow Street on a sampler. Push the silver clouds, peel the banana slowly "
                "and sit three minutes for a screen test. Survive the pit on the Bowery while the flyers rewrite themselves behind your back. Keep "
                "the break going on two turntables in the Bronx until the room goes off. Hold still on East 126th Street and fifty seven musicians "
                "pose. Walk to the point of the Vanguard and the trio swells, and so do you. Rub the stump at the Apollo before you take the stage, "
                "or meet the Sandman. Then look straight up the Chelsea stairwell."),
         shots=[("shots/lobby.jpg", "The record store: the floor in the middle is a turntable"),
                ("shots/jones.jpg", "Jones Street in the snow: stand where the photographer stood"),
                ("shots/stmarks.jpg", "96 and 98 St. Marks Place: pull the sleeve and the tenants change"),
                ("shots/ludlow.jpg", "Ludlow and Rivington: a sampler that chops the corner"),
                ("shots/factory.jpg", "The silver loft: push the clouds, peel slowly"),
                ("shots/cbgb.jpg", "315 Bowery: the pit, and the flyers that will not sit still"),
                ("shots/sedgwick.jpg", "1520 Sedgwick Avenue: two copies of one record and a break that never ends"),
                ("shots/harlem.jpg", "East 126th Street: hold still and everybody poses"),
                ("shots/vanguard.jpg", "178 Seventh Avenue South: walk to the point of the wedge"),
                ("shots/apollo.jpg", "253 West 125th Street: rub the stump, then take the stage"),
                ("shots/chelsea.jpg", "222 West 23rd Street: rent paid in paintings, twelve floors up")],
         keywords=["ON RECORD", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "New York music history", "record covers", "hip hop", "jazz", "punk", "optical illusions", "virtual museum"]),
    dict(slug="garyvee", page="garyvee.html", nav="GARY VEE", branch="clouds-and-dirt-v2",
         repo=os.path.join(ROOT, "CLOUDS AND DIRT V2 2026-10-22"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/plates", "assets/glb"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="CLOUDS AND DIRT", name="CLOUDS AND DIRT: a tower for Gary Vaynerchuk", h1="CLOUDS AND <em>DIRT</em>",
         title="CLOUDS AND DIRT · A tower for Gary Vaynerchuk · a walkable gallery by MLow",
         desc=("CLOUDS AND DIRT, a walkable three.js tower for Gary Vaynerchuk built by MLow with NEW YORKERS: twenty five floors, the first twelve from the "
               "stockroom of Shoppers Discount Liquors in Springfield, New Jersey to the sky over Manhattan. The lobby with a lift that goes "
               "to every floor, the dirt with a folding table of garage sale finds, the Wine Library TV desk and its thousand tapes, seven books "
               "the size of doors and a heavy bag, the 25th floor of 10 Hudson Yards where a ring light cuts one visitor into sixty four pieces "
               "of content, the studio, the twelve and a half ingredients on a Park Avenue floor, the VeeFriends carousel with the very very "
               "very very lucky black cat, the VeeCon stage that fills as you move, the attention exchange, the owner's box with the uprights, "
               "and the clouds, where his lines hang in the air and only line up from one star each, then the VeeFriends wing that could not exist "
               "anywhere but online: a doodle room that draws itself while you look away, a vault of the six Spectaculars rendered live, the trading "
               "card arena where you play first to seven, Burn Island, the VeeDome parade, the Gift Goat's three doors, the gym that flips at half "
               "court, a newspaper press that prints you in halftone, the toy aisle with an honest claw, the punk vault with three voxel giants, "
               "the Wine Library cellar with its mezzanine, game day with the 1969 scoreboard, and the feed. His honorary New Yorker portraits by "
               "MLow and the VeeFriends one hang on the walls with census New Yorkers from the blocks. Every floor plays its own song and hides a "
               "trick, and V cuts any floor into a vertical clip. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, Z for binoculars, N or WAY OUT for a line on the floor to the next door, [ and ] for the previous and next floor, R for a random floor, K to skate.",
         phone="CLOUDS AND DIRT works on a phone: left thumb walks, right thumb looks, tap anything. Turn the sound on: every floor has its own song.",
         tagline="Take the lift. Press 5. Then find the wing.",
         # the skate film under the tower (add_media.py clouds-and-dirt; also leads media.html)
         films=[dict(dir="clouds-and-dirt", kick="The skate film", h="Twenty five floors, one skateboard", dur="2:00", label="CLOUDS AND DIRT, the skate film, by MLow",
                     sub="Twenty five unlikely riders skate the tower top to bottom: the cab out of the lobby, the Kid in the dirt, the Lucky Black Cat over the "
                         "VeeCon stage, the panda in the vault, the worm on Burn Island, the pig that flips the gym. Every floor's song, every floor's trick on the beat.")],
         blurb=("A tower for the man who day trades attention, with the dirt in the basement and the clouds on the roof. Flip a garage sale find "
                "on the folding table. Taste four wines at the Wine Library desk and the whole room changes colour. Jab the heavy bag three times, "
                "then throw the hook. Stand in the ring light on floor 25 and watch sixty four screens cut you into content. Record six seconds "
                "of yourself in the studio and meet your loop. Walk the twelve and a half ingredients under his portrait on Park Avenue and face "
                "the mirror of kind candor. Ride the carousel of friends and wait eleven seconds on the Patient Panda. Fill an arena by walking. "
                "Buy attention while it is underpriced. Throw a football through the uprights from the owner's box. Then stand on a star on the "
                "roof and read the sky."),
         shots=[("shots/lobby.jpg", "The lobby: a directory, a lift with twelve buttons, a suitcase from 1978 turned to stone"),
                ("shots/dirt.jpg", "The dirt: the stockroom in Springfield, New Jersey, and the folding table"),
                ("shots/library.jpg", "Wine Library TV: four wines, one bucket, a thousand tapes"),
                ("shots/crush.jpg", "Crush It: seven books the size of doors and a heavy bag"),
                ("shots/hudson.jpg", "Floor 25, 10 Hudson Yards: the ring light and the wall of sixty four"),
                ("shots/studio.jpg", "The studio: document, do not create"),
                ("shots/empathy.jpg", "Empathy Over Park Avenue: the portraits and the twelve and a half ingredients"),
                ("shots/carousel.jpg", "The carousel of friends: eight horses, one lucky black cat"),
                ("shots/veecon.jpg", "VeeCon: one is greater than zero"),
                ("shots/attention.jpg", "The attention exchange: buy it underpriced"),
                ("shots/jets.jpg", "The owner's box: the knitted five and the uprights"),
                ("shots/clouds.jpg", "The clouds: the words in the sky, read from the stars"),
                ("shots/doodle.jpg", "The doodle room: the walls draw while you are not looking"),
                ("shots/vault.jpg", "The Spectacular vault: hologram, lava, bubble gum, diamond, gold, emerald"),
                ("shots/tcg.jpg", "The TCG arena: Aura, Skill, Stamina, first to seven"),
                ("shots/burn.jpg", "Burn Island: throw a token in the crater"),
                ("shots/veedome.jpg", "The VeeDome: the parade of friends"),
                ("shots/goat.jpg", "The Gift Goat's room: three doors, three sizes"),
                ("shots/middle.jpg", "Meet Me in the Middle: the gym flips at half court"),
                ("shots/comics.jpg", "The Sunday comics: the press prints you"),
                ("shots/toys.jpg", "The toy aisle: the claw is honest"),
                ("shots/punks.jpg", "The punk vault: one of the giants is watching you"),
                ("shots/cellar.jpg", "The cellar: ten thousand bottles and the sweaty sock"),
                ("shots/gameday.jpg", "Game day: run the route, then look at the scoreboard"),
                ("shots/feed.jpg", "The feed: make the thumb stop")],
         keywords=["CLOUDS AND DIRT", "Gary Vaynerchuk", "GaryVee", "VeeFriends", "VeeFriends TCG", "Compete and Collect", "Burn Island", "VaynerMedia", "VeeCon", "CryptoPunks", "Wine Library", "New York Jets", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "virtual museum", "10 Hudson Yards"]),
    dict(slug="garyvee-v1", page="garyvee-v1.html", nav="GARY VEE", branch="clouds-and-dirt",
         repo=os.path.join(ROOT, "CLOUDS AND DIRT 2026-10-22"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/plates", "assets/glb"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="CLOUDS AND DIRT V1", name="CLOUDS AND DIRT V1: the first tower for Gary Vaynerchuk", h1="CLOUDS AND <em>DIRT</em>",
         title="CLOUDS AND DIRT V1 · the first twelve floors · a walkable gallery by MLow",
         desc=("CLOUDS AND DIRT, a walkable three.js tower for Gary Vaynerchuk built by MLow with NEW YORKERS: twelve floors, from the "
               "stockroom of Shoppers Discount Liquors in Springfield, New Jersey to the sky over Manhattan. The lobby with a lift that goes "
               "to every floor, the dirt with a folding table of garage sale finds, the Wine Library TV desk and its thousand tapes, seven books "
               "the size of doors and a heavy bag, the 25th floor of 10 Hudson Yards where a ring light cuts one visitor into sixty four pieces "
               "of content, the studio, the twelve and a half ingredients on a Park Avenue floor, the VeeFriends carousel with the very very "
               "very very lucky black cat, the VeeCon stage that fills as you move, the attention exchange, the owner's box with the uprights, "
               "and the clouds, where his lines hang in the air and only line up from one star each. His honorary New Yorker portraits by MLow "
               "and the VeeFriends one hang on the walls with census New Yorkers from the blocks. Every floor plays its own song and hides a "
               "trick. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, Z for binoculars, N or WAY OUT for a line on the floor to the next door, [ and ] for the previous and next floor, R for a random floor, K to skate.",
         phone="CLOUDS AND DIRT works on a phone: left thumb walks, right thumb looks, tap anything. Turn the sound on: every floor has its own song.",
         tagline="Take the lift. Press 5.",
         blurb=("A tower for the man who day trades attention, with the dirt in the basement and the clouds on the roof. Flip a garage sale find "
                "on the folding table. Taste four wines at the Wine Library desk and the whole room changes colour. Jab the heavy bag three times, "
                "then throw the hook. Stand in the ring light on floor 25 and watch sixty four screens cut you into content. Record six seconds "
                "of yourself in the studio and meet your loop. Walk the twelve and a half ingredients under his portrait on Park Avenue and face "
                "the mirror of kind candor. Ride the carousel of friends and wait eleven seconds on the Patient Panda. Fill an arena by walking. "
                "Buy attention while it is underpriced. Throw a football through the uprights from the owner's box. Then stand on a star on the "
                "roof and read the sky."),
         shots=[("shots/lobby.jpg", "The lobby: a directory, a lift with twelve buttons, a suitcase from 1978 turned to stone"),
                ("shots/dirt.jpg", "The dirt: the stockroom in Springfield, New Jersey, and the folding table"),
                ("shots/library.jpg", "Wine Library TV: four wines, one bucket, a thousand tapes"),
                ("shots/crush.jpg", "Crush It: seven books the size of doors and a heavy bag"),
                ("shots/hudson.jpg", "Floor 25, 10 Hudson Yards: the ring light and the wall of sixty four"),
                ("shots/studio.jpg", "The studio: document, do not create"),
                ("shots/empathy.jpg", "Empathy Over Park Avenue: the portraits and the twelve and a half ingredients"),
                ("shots/carousel.jpg", "The carousel of friends: eight horses, one lucky black cat"),
                ("shots/veecon.jpg", "VeeCon: one is greater than zero"),
                ("shots/attention.jpg", "The attention exchange: buy it underpriced"),
                ("shots/jets.jpg", "The owner's box: the knitted five and the uprights"),
                ("shots/clouds.jpg", "The clouds: the words in the sky, read from the stars")],
         keywords=["CLOUDS AND DIRT", "Gary Vaynerchuk", "GaryVee", "VeeFriends", "VaynerMedia", "VeeCon", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "virtual museum", "Wine Library", "10 Hudson Yards"]),
    dict(slug="eviction", page="eviction.html", nav="EVICTION", branch="the-eviction",
         repo=os.path.join(ROOT, "THE EVICTION 2026-10-20"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/plates", "assets/glb", "assets/figs"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="THE EVICTION", name="THE EVICTION: 4F", h1="THE <em>EVICTION</em>",
         title="THE EVICTION · 4F, a year in a railroad apartment · a walkable world by MLow",
         desc=("THE EVICTION, a walkable three.js world by MLow built on two NEW YORKERS, The Eviction (No. 47) and The Landlord (No. 39): "
               "one Williamsburg tenement under the J at Broadway and Marcy Avenue, and the year apartment 4F was emptied, October 2026 to "
               "October 2027. The curb under the el, the vestibule and the peephole of 1A, the painted fourth floor hall, 4F itself as a forced "
               "perspective shadowbox whose year runs on a wall calendar (tear a month and the movers carry something out; pin a month and the flat "
               "stays), the management office where the Landlord grows as you come near, the treadmill of housing court, tar beach and the "
               "Landlord's penthouse over Central Park. Census New Yorkers from the block are on every wall and in every trick. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, N or WAY OUT for a line on the floor to the next room, [ and ] for the previous and next room. ?chapter=0 to 12 opens 4F at that month.",
         phone="THE EVICTION works on a phone: left thumb walks, right thumb looks, tap anything. The 4F panel tears, pins and follows the calendar.",
         tagline="Pin the month you want to keep",
         blurb=("One building on Broadway, under the J. On the first of every month something leaves apartment 4F, and it ends up on the curb "
                "under the el. Wait for a train and the poster on the column turns into a film. Open the mailboxes for the postcards; look through "
                "the peephole of 1A and see who is standing behind you. Stand on the doormat and a painting stands up out of the tile. Do not look "
                "away from the end of the fourth floor hall. Stand on the mark at the door of 4F: nine metres of railroad flat read as twenty. Tear "
                "the calendar, change the channel, touch where a frame used to hang. Walk up to the Landlord's desk and watch him grow. Take a "
                "number at housing court, or walk the treadmill forever. Then open the coop on the roof: the pigeons hold up a painting."),
         shots=[("shots/apartment.jpg", "4F from the door: a railroad flat in forced perspective, a shadowbox"),
                ("shots/inside.jpg", "Inside 4F: every room smaller than the last"),
                ("shots/street.jpg", "Broadway under the J: the curb, piled with what left 4F"),
                ("shots/vestibule.jpg", "The vestibule: from the doormat a painting stands up off the tile"),
                ("shots/hallway.jpg", "The fourth floor: he only moves when you are not looking"),
                ("shots/landlord.jpg", "The management office: the closer you come, the bigger he gets"),
                ("shots/court.jpg", "Housing court: the window gets no closer until you take a number"),
                ("shots/roof.jpg", "Tar beach: the flock holds up a painting over the bridge"),
                ("shots/roofchalk.jpg", "Chalk on the tar, drawn for the top of the stairs")],
         keywords=["THE EVICTION", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "dynamic NFT", "forced perspective", "anamorphic", "Williamsburg", "J train", "housing court", "railroad apartment"]),
    dict(slug="sewers", page="sewers.html", nav="SEWERS", branch="live-from-the-sewers",
         repo=os.path.join(ROOT, "LIVE FROM THE SEWERS 2026-10-23"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/plates", "assets/glb"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="LIVE FROM THE SEWERS", name="LIVE FROM THE SEWERS: home of the Pizza Rat", h1="LIVE FROM THE <em>SEWERS</em>",
         title="LIVE FROM THE SEWERS · Home of the Pizza Rat · a walkable gallery by MLow",
         desc=("LIVE FROM THE SEWERS, a walkable photoreal three.js gallery by MLow with NEW YORKERS: you fall through a manhole on First Avenue "
               "and land at rat scale in the city under the city, where every human thing is colossal and the rats have built a world out of "
               "everything New York drops, flushes and forgets. Twelve rooms: customs at Arrivals, the Pizza Rat shrine on the First Avenue L "
               "stairs (September 2015), the goldfish Upstate Farm, the Gator Room after the alligator pulled from a sewer on East 123rd Street in "
               "February 1935, a cathedral carved from a fatberg, the Crumb Exchange under a bakery, lost property at the size it was lost at, "
               "Alfred Beach's secret 1870 pneumatic subway, a spa that runs on Con Edison steam, the rat council in the City Hall station closed "
               "in 1945, the bodega cat who runs the border, and the sewer king who rents his throne by the minute. Census New Yorkers by MLow hang "
               "on every wall. Every room plays its own song and hides a trick. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, Z for binoculars, N or WAY OUT for a line on the floor to the next door, [ and ] for the previous and next room, R for a random room, K to skate.",
         phone="LIVE FROM THE SEWERS works on a phone: left thumb walks, right thumb looks, tap anything. Turn the sound on: every room has its own song.",
         tagline="You fell in. Everybody falls in.",
         blurb=("Fall through the manhole and walk your shadow through customs: it is approved, you are not. Push the slice up the stairs "
                "to Pizza Rat's shrine and watch the stairs get longer. Pull the chain in the goldfish Upstate Farm and the room fills past your "
                "eyes. Pull the 1935 clipping and the gator wakes; hold still by the water and something surfaces. Light six votives in the "
                "fatberg. Drop one sesame seed and crash the Crumb Exchange. Ring the left earbud and every rat leaves. Pump the bellows until "
                "the 1870 train is cancelled due to atmosphere. Turn the spa dial from bagel to lawsuit. Vote until the agenda returns to item one. "
                "Cross the bodega border only while the cat is not looking. Then pull the plunger and go up one problem."),
         shots=[("shots/arrivals.jpg", "Arrivals: customs under the manhole, and the board of everything that fell in today"),
                ("shots/slice.jpg", "The Slice: Pizza Rat's shrine on the First Avenue L stairs"),
                ("shots/flushed.jpg", "Flushed: the Upstate Farm, run by a goldfish in brogues"),
                ("shots/gator.jpg", "The Gator Room: two sets nightly since 1935"),
                ("shots/fatberg.jpg", "The Fatberg: a cathedral of everything poured down the drain"),
                ("shots/exchange.jpg", "The Crumb Exchange: do not drop the seed"),
                ("shots/grate.jpg", "Lost Through the Grate: the left earbud, emotionally unavailable"),
                ("shots/pneumatic.jpg", "Beach Pneumatic: one block, one fan, one car, 1870"),
                ("shots/steam.jpg", "The Steam Baths: a spa that runs on Con Edison"),
                ("shots/cityhall.jpg", "City Hall Loop: the rat council returns to item one"),
                ("shots/border.jpg", "The Border: the bodega cat only sees you when you move"),
                ("shots/throne.jpg", "The Throne: the sewer king, three dollars a minute")],
         keywords=["LIVE FROM THE SEWERS", "Pizza Rat", "New York sewers", "alligators in the sewers", "Beach Pneumatic Transit", "City Hall station", "fatberg", "bodega cat", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "virtual museum", "rat scale"]),
    dict(slug="same", page="same.html", nav="SAME", branch="same-difference",
         repo=os.path.join(ROOT, "SAME DIFFERENCE 2026-10-20"),
         skip=(), need=("index.html", "assets/gallery.js", "assets/data.js", "assets/pairs", "assets/posters", "assets/glb"),
         still=os.path.join("site", "assets", "poster.jpg"),
         tag="SAME DIFFERENCE", name="SAME DIFFERENCE", h1="SAME <em>DIFFERENCE</em>",
         title="SAME DIFFERENCE · a museum of New Yorkers who sound the same · a walkable world by MLow",
         desc=("SAME DIFFERENCE, a walkable three.js museum by MLow of New Yorkers who sound the same: PROFIT and PROPHET, BRAKE and BREAK, "
               "KNEW and NEW, TAWK and TOCK. Fifty three pairs, each a diptych of two eye flower New Yorkers painted in MLow's hand, in nine real New York "
               "places that each make a diptych move a different way: lenticular ads on a subway platform, split flap boards that flip on the New York "
               "hour, two sided deli signs that spin as you pass, a two way mirror with a light switch, a Whispering Gallery where a word arrives "
               "as its New York twin, Manhattanhenge's shadow climbing the facades of 42nd Street, a tunnel blink on the 6 train, subway doors that close the two words "
               "into one picture, and a gift shop of twenty four posters with a scratch off. Free in your browser."),
         controls="WASD walk, SHIFT hurry, mouse to look, click anything, M for sound, N or WAY OUT for a line on the floor to the next room, [ and ] for the previous and next room.",
         phone="SAME DIFFERENCE works on a phone: left thumb walks, right thumb looks, tap anything.",
         tagline="Two New Yorkers, one word",
         blurb=("PROFIT // PROPHET: two New Yorkers who both call the crash, and only one gets a bonus. Every picture in here is a pair like "
                "that. Walk past an ad on the platform one way, then the other, and it changes under you; stand dead centre and you get both. "
                "Click a split flap board and watch MORNING clack into MOURNING. Walk fast past the deli signs and they spin. Flip the light "
                "switch in the precinct and the mirror turns to glass. Whisper TAWK into a corner of the vault and TOCK lights up across the way. "
                "Watch the sun go down 42nd Street and turn SON into SUN. Ride the 6 through a blink. Then scratch the ticket in the gift shop."),
         shots=[("shots/henge.jpg", "Manhattanhenge: 42nd Street at sundown, the shadow turning SON into SUN on the facades"),
                ("shots/platform.jpg", "Coming // Going: walk past from the west and the ad says PROFIT"),
                ("shots/platform2.jpg", "The platform opens onto the tracks, and the train coming in"),
                ("shots/departures.jpg", "Departures: split flap pictures that flip on the New York hour"),
                ("shots/deli.jpg", "Open // Closed: two sided deli signs that spin as you pass"),
                ("shots/interrogation.jpg", "The two way mirror, their side lit: who is really in there"),
                ("shots/whisper.jpg", "The Whispering Gallery: whisper TAWK, hear TOCK"),
                ("shots/doors.jpg", "Stand clear of the closing doors: the chime, and the two words meet as one picture"),
                ("shots/subway.jpg", "The tunnel blink: every picture on the 6 becomes the other word"),
                ("shots/shop.jpg", "The gift shop: the posters, and ONE // WON on the counter")],
         keywords=["SAME DIFFERENCE", "MLow", "NEW YORKERS", "walkable gallery", "three.js", "homophones", "diptych", "lenticular", "split flap", "Whispering Gallery", "Manhattanhenge", "New York accent"]),
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
            if r not in want and r not in ("poster.jpg", "phone-gpu.js"): os.remove(os.path.join(root, f))
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
    # the phone guard: copied in beside index.html and loaded before anything else in <head>
    gpu = G.get("gpu", {})
    shutil.copyfile(PHONE_GPU, os.path.join(dst, "phone-gpu.js"))
    gv = hashlib.sha256(open(PHONE_GPU, "rb").read()).hexdigest()[:10]
    attrs = "".join(f' data-{k}="{v}"' for k, v in (("cap", gpu.get("cap", 512)), ("art", gpu.get("art")), ("artcap", gpu.get("artcap"))) if v)
    tag_ = f'<script src="phone-gpu.js?v={gv}"{attrs}></script>'
    html2 = re.sub(r'<script src="phone-gpu\.js[^"]*"[^>]*></script>\n?', "", html)
    m = re.search(r'<head[^>]*>', html2, re.I)
    if not m: raise SystemExit(f"{slug}: index.html has no <head> for the phone guard")
    html2 = html2[:m.end()] + "\n" + tag_ + html2[m.end():]
    if html2 != html:
        open(os.path.join(dst, "index.html"), "w", encoding="utf-8").write(html2); html = html2
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
    if G.get("tagline") or G.get("shots"):   # only the galleries that use them carry these rules
        extra_css += """
.gl .tagline{font-family:Fraunces,Georgia,serif;font-style:italic;font-size:clamp(19px,2.6vw,26px);color:#E8EEF4;margin:0 auto 14px;max-width:760px}
.gl .shots{max-width:1240px;margin:40px auto 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:18px;text-align:left}
.gl .shots figure{margin:0}
.gl .shots a{display:block;border-radius:12px;overflow:hidden;border:1px solid #223;background:#080D16}
.gl .shots img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;transition:transform .5s}
.gl .shots a:hover img{transform:scale(1.03)}
.gl .shots figcaption{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;color:#8FA7AB;margin-top:9px;line-height:1.6;text-transform:uppercase}
@media (prefers-reduced-motion:reduce){ .gl .shots img{transition:none} .gl .shots a:hover img{transform:none} }
"""
    tagline_html = f'\n    <p class="tagline">{G["tagline"]}</p>' if G.get("tagline") else ""
    collect_html = ""
    if G.get("collect"):
        K = G["collect"]
        extra_css += """
.gl .grail{max-width:1100px;margin:22px auto 0;display:flex;align-items:center;justify-content:space-between;gap:28px;text-align:left;
  padding:26px 30px;border:1px solid #2a3d52;border-top:4px solid var(--pink,#DC6F57);border-radius:14px;background:linear-gradient(180deg,#0F1A26,#0b141e)}
.gl .grail .eyebrow{color:var(--pink,#DC6F57)}
.gl .grail h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(24px,3.4vw,36px);margin:6px 0 8px}
.gl .grail p{margin:0;max-width:620px}
.gl .grail .btn{flex:none;white-space:nowrap}
.gl .grail .buy{flex:none;display:flex;flex-direction:column;align-items:stretch;gap:12px}
.gl .grail .pr{display:flex;justify-content:space-between;align-items:baseline;gap:18px;border-bottom:1px solid #24394A;padding-bottom:8px}
.gl .grail .pr small{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8FA7AB}
.gl .grail .pr b{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:26px;color:#ECE8DD}
@media (max-width:760px){.gl .grail{flex-direction:column;align-items:flex-start;padding:22px 20px}.gl .grail .buy{width:100%}.gl .grail .btn{width:100%;justify-content:center}}
"""
        collect_html = (f'\n  <section class="grail" aria-label="Collect {G["name"]}"><div><div class="eyebrow">{K["kicker"]}</div><h2>{K["h"]}</h2><p>{K["p"]}</p></div>'
                        f'<div class="buy">' + "".join(f'<div class="pr"><small>{a}</small><b>{b}</b></div>' for a, b in K.get("price", ())) + f'<a class="btn pink" href="{K["url"]}" target="_blank" rel="noopener">Collect it on {K["where"]} \u2197</a></div></section>')
    # optional stills under the description: (file inside the copied gallery, caption); a click opens the full frame
    shots_html = ""
    if G.get("shots"):
        missing = [f for f, _ in G["shots"] if not os.path.exists(os.path.join(dst, f))]
        if missing: raise SystemExit(f"{slug}: shots missing from assets/{slug}: {missing}")
        figs = "".join(f'\n    <figure><a href="assets/{slug}/{f}?v={v}" target="_blank" rel="noopener"><img src="assets/{slug}/{f}?v={v}" '
                       f'alt="{c}, {G["name"]} by MLow" width="1280" height="720" loading="lazy" decoding="async"></a><figcaption>{c}</figcaption></figure>'
                       for f, c in G["shots"])
        shots_html = f'\n  <section class="shots" aria-label="Shots from {G["name"]}">{figs}\n  </section>'
    body = f"""<main class="gl">
  <div class="phone">{G['phone']}</div>
  <div class="frame"><iframe id="glFrame" src="assets/{slug}/?v={v}" title="{G['name']} by MLow" allow="fullscreen; autoplay; clipboard-write" loading="eager"></iframe></div>{collect_html}
  <div class="how">{G['controls']}<br><a href="assets/{slug}/?v={v}" target="_blank" rel="noopener">Open full screen</a> &nbsp;·&nbsp; <a href="{GITHUB}{G['branch']}" target="_blank" rel="noopener">The code</a></div>
  <div class="under">
    <div class="eyebrow">{G.get("eyebrow", "A walkable gallery by MLow")}</div>
    <h1>{G['h1']}</h1>{tagline_html}
    <p>{G['blurb']}</p>
  </div>{shots_html}{films_html}
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
