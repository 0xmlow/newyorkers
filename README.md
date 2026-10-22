# CLOUDS AND DIRT: a tower for Gary Vaynerchuk

A walkable three.js gallery by MLow, built with NEW YORKERS. Twelve floors for Gary Vee, from the stockroom of his father's
liquor store in Springfield, New Jersey to the sky over Manhattan: the places are his, the lines are his (verbatim where the
plaque says so, credited where they are only attributed), the eye flower heads and the paintings are MLow's. The man himself
appears only as MLow painted him: the two honorary New Yorker portraits (Empathy Over Park Avenue, The Man Who Bet on
Attention) hang on 12, the VeeFriends portrait (The Carousel of Friends, the very very very very lucky black cat) hangs on 268,
and a VaynerMedia alumna hangs by the wine wall on 25. Every floor's walls carry twelve census New Yorkers from a block that
fits the floor (`HOODS` in `_build/build.py`), every floor plays its own song synthesised in the browser (`_build/src/music.js`),
and every floor hides a trick.

Open it: double click `Open CLOUDS AND DIRT.command`. On the site it is `garyvee.html` (n3wyorkers.com/garyvee),
registered in `NEW YORKERS SITE/_build/build_galleries.py` as slug `garyvee`, which copies `site/` into `assets/garyvee`.

| Floor | Room | Year on the plate | Song | The trick |
|---|---|---|---|---|
| L | The Lobby, 10 Hudson Yards | 2016 | a slow house pulse | a directory and a lift with twelve brass buttons: press one and you are there; press 5 for his number; a suitcase from 1978, excavated |
| B1 | The Dirt, Shoppers Discount Liquors | 1994 | a lo fi basement beat | Trash Talk: eight garage sale finds on a folding table, buy at the sticker, sell online, a ledger counts the profit; the 1997 computer sings a modem |
| 2 | Wine Library TV | 2011 | the Thunder Show riff | four glasses, four wines, each one tints the whole room; the spit bucket; a wall of a thousand tapes that counts up as you approach and lights the thousandth when you sit still at the desk |
| 3 | Crush It | 2008 | a boxing gym breakbeat | seven books the size of doors along the walls, one idea each; a heavy bag that only answers a right hook after three jabs; the 2008 microphone turned to stone (just stop watching Lost) |
| 25 | VaynerMedia, Floor 25 | 2016 | deep house at golden hour | the content machine: a glass box with a ring light, a camera inside that films you (the visitor is a figure only that camera sees), and sixty four screens that each crop you differently; stay in and the counter reaches sixty four; the wine wall and the boxing glove booth from the real floor |
| 24 | The Studio | 2015 | a podcast bed | press record, six seconds of you are kept, and a ghost of you plays them on loop by the desk; the $1.80 wall of ninety two cent comments |
| 12 | Empathy Over Park Avenue | 2021 | strings, no drums | the two portraits; twelve ingredients from Twelve and a Half as floor tiles that light as you walk them, and the half one, kind candor, in a mirror that tells you a true thing after it has let you look for four seconds |
| 268 | The Carousel of Friends | 2021 | a calliope waltz | a carousel that turns you with it, eight horses with real character names, the lucky black cat on one; sit still for eleven seconds for the Patient Panda; the wall of sixty six verified names |
| 7000 | VeeCon | 2022 | an arena anthem | one is greater than zero: the crowd starts at one and fills as long as you keep moving on the stage, up to the seven thousand who came to Minneapolis; confetti at seven thousand |
| 1.80 | The Attention Exchange | 2024 | a ticker | eight platforms with live prices on a board; click to buy, click to sell; a row is underpriced when it sits well under its average; three winning trades for the egg; the penny jar |
| 5 | The Owner's Box | 2021 | a drum line | a football that leaves your hand along your line of sight; through the uprights above the bar and the house applauds; the knitted five in a case |
| R | The Clouds | 2016 | long pads and a bell | eight of his lines cut into tiles and thrown into the sky: each reads only from its gold star on the deck; a clock whose years hand moves while you stand still and whose days hand moves while you walk |

82 eggs, counted from the source at build time (`count_eggs` in build.py).

## How it was made

- **Engine**: ON RECORD's (`../ON RECORD 2026-10-20/_build/src`), forked whole on 2026-10-22: plates rebuilt as depth meshes,
  lazy floors, the finishing pass, the power throttle, the phone guard, WAY OUT, skate mode. New here: `rooms.js` and `build.js`
  (the floors), `music.js` (twelve styles), a `flat` plate mode in `main.js` for horizon pictures that a depth mesh smears
  (Park Avenue, the field, the sky), a layer 1 avatar of the visitor for cameras inside the world, honorary pieces on the
  walls with their own card and link.
- **Plates and walls**: Adobe Firefly in the browser (Gemini 3 Nano Banana Pro, 21:9 2K for plates, 16:9 2K for walls),
  driven as a page side loop through the Chrome extension, with the eye flower as the reference image; prompts in
  `tools/plates.tsv` and `tools/walls.tsv`, raw results in `work/ff_plates` and `work/ff_walls` (not in git). Three plates were
  refired with an empty foreground (the exchange, the wine desk, the box). The same prompts also ran through ChatGPT ImageGen via
  the Codex CLI as a fallback set (`work/plates_cx`); Firefly won on realism and perspective. Depth from
  `python3 _build/depth.py work/plates_raw/*.png` (Depth Anything V2 Small, local).
- **Cast and props**: no new 3D. The cast are ON LOCATION's Tripo GLBs, the props its Poly Haven CC0 models, read straight from
  `../ON LOCATION 2026-10-10/work/glb_pass` by build.py; the cat, pigeon and rat are THE MARKS heroes; the dog and gull are museum
  props. The carousel horses are Poly Haven's horse statue recoloured in code.
- **Research**: two dossiers (biography, quotes with their status, VaynerMedia at 10 Hudson Yards floor 25 and half of 24 by
  Spector Group, VeeFriends facts and the verified character names, VeeCon dates). Things the first brief had wrong and the
  build does not say: there was no Macy's balloon; Series 2 minted in April 2022, not August; the brand colour is purple; "Kind
  Koala", "Self Aware Shark" and a few others are not real characters (the wall uses only verified names).
- **Build**: `python3 _build/build.py` (or `--js` to rebundle only). **Check**: `python3 _build/check_all.py work/check` renders
  every floor headless and prints console errors; `python3 work/tricks.py` fires every floor's trick through `shot.py --eval`
  and prints the eggs it laid (set `window.__POWER.blurred = false` first: an unfocused tab runs at a third of the speed).

## Brand check

All twelve plates and walls looked at full size: eye flower heads everywhere, no human faces, signs say NEW YORKERS, N3W,
COUNTED, MLOW, CLOUDS AND DIRT or VEE. No VaynerMedia, VeeFriends or GaryVee logo is reproduced anywhere; the names appear as
words on signs and plaques, as facts. No VeeFriends character is drawn; the characters are named on plates and a wall. Quotes
marked verbatim in the research are on plaques with their source; the two attributed lines (legacy over currency, marketers
ruin everything) are introduced with "as he says".

## Not verified

- Never touched by a person: every check was headless Chrome on this Mac with scripted positions and clicks.
- Fired by script: the lift, the flips and the modem, the four wines and the thousandth tape, the hook and the shelf, the sixty
  four, the clip, the twelve and a half and the mirror, the ride and the panda, one and seven thousand, the uprights, the sky
  clock. Not fired by script: the board trades (the click needs a real raycast point), the quotes read from the stars (the camera
  was placed on star one and the line read, but the egg was not asserted).
- The music was never listened to. It is synthesised from scratch and its mix and levels are guesses.
- Phones: the lobby and the carousel were shot as an iPhone and laid out; the phone guard is inherited from ON RECORD, untried on
  a device.
- Spend: $0 (Firefly on the silan account's unlimited plan, ChatGPT ImageGen through Codex, CC0 and existing models, local depth).
