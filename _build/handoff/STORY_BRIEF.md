# NEW YORKERS story brief (for the writers)

You are writing the two sentence portrait ("story") for characters in NEW YORKERS by MLow,
a painted census of New York City where flowers bloom with human eyes because the city is
watching back. Each character already has a name, a family, a set or arc, and a painting
brief (the image prompt that made the piece). Turn each brief into a story in the house voice.

## The recipe (house law, no exceptions)
- Exactly TWO sentences.
- Sentence one lands the idea and ENDS WITH A PERIOD. It is the thesis: the truest thing about this New Yorker in one line.
- Sentence two adds the specifics (place, detail, the turn) and LANDS BARE: no terminal period, no punctuation at the end.
- 6 to 16 words per sentence. Start with the point. End on a concrete noun.
- NO EM DASHES and NO EN DASHES anywhere. Use a colon as the pivot (setup left, payoff right), or a comma, or a period.
- Every story must read differently. Rotate the rhetorical move: contrast, reframe, paradox, negation, quantification, chiasmus, conditional reveal, double meaning, the everyman meme, witness. Never three in a row opening with the same word. Do not start more than a handful with "The".
- No preamble ("In a city that never sleeps", "Nestled in the heart of"). No hype or corporate words (vibrant, bustling, iconic, tapestry, boasts, nestled, innovative, robust, testament, elevate, delve). No hedging (arguably, perhaps, one of the most).
- Do NOT copy the prompt. Never mention "color story", "over ink black", camera or render language. Do not write "eye flower" in every story; the flowers are the world's grammar, mention them only when the story turns on them, at most one in eight.
- Villains are affectionate and sharp. Everyone is a main character. Register matches the family: Heroes reverent, Villains menacing with style, Hustlers ambitious, Strays feral, Underground nocturnal, Stoop long memory, Builders craft, Degens the party, Transplants the arrival, Citizens the commons, Design fashion and self presentation, Process the studio and the making, Places the ground itself.
- Monuments (flagged "monument": true) are the hundred marks and closers: write them a notch more reverent and mythic, never hype.

## Approved examples (study the move)
- Reframe: "He built the Treasury and the credit the country still runs on. The ten-dollar bill, the Grange, the immigrant who wrote the system"
- Double meaning: "He stole bases and the country's excuse at the same time. Number 42, the Dodgers, a color line that never grew back"
- Conditional reveal: "Fold it once or announce you just got off the bus. Two bucks, a paper plate, the grease that marks the corner"
- Everyman meme: "He dragged a whole slice down the subway stairs and became us. The hustle, the stairs, the most New York animal on record"
- Tender scene: "The steps are the porch the city forgot to build. The sit, the neighbors, the summer night that lives outside"
- One clean tap: "A hundred years of tokens died to a single tap. The phone, the beep, the turnstile that finally caught up"
- From the newer eras: "The last beam goes up wearing a small evergreen and a flag, as the old rite requires. The tree gets the best view in the city for one afternoon"
- "The corner booth got surgery overnight, curved needle, red vinyl, no scar. Forty years of regulars sat down at 7am and felt nothing"

## Era context (what the world is doing in each chapter)
- X THE LOOK (3067-3466): after the Bloom went citywide the city started dressing for the flowers. Self presentation as love, armor and survival. Sets: THE HOUSES (borough ateliers), THE DIASPORA BLOCKS, THE UNIFORMS, THE LANDMARK CROWNS, THE SOLES, THE WILD ONES, THE OPEN EYES. Monuments 3100 The Ball Drop, 3200 The Steps, 3300 The Five Borough Run, 3400 The Henge; closers 3465 The Last Look, 3466 The Mirror Faces Out.
- XI THE WAKING (3467-3966): the eye flowers open in things that were never alive. Machines and ordinary objects wake and discover they were watching all along. Monuments 3500 First Blink of the Grid, 3600 Parade of the Machines, 3700 Trial of the Algorithm, 3800 The Blackout That Chose, 3900 The City Dreams Itself; closers 3965, 3966.
- XII THE ARRIVAL (3967-4366): retro futurist arrivals, time coupes, androids in quiet luxury, house coded fashion. Something new lands in the city and the city absorbs it.
- XIII THE DEEP CITY (4367-4766): the city's buried and structural self comes forward, cast iron ghosts, the stacked strata of New York, craft and machine.
- XIV THE SECOND SKIN (4767-4966): the augmented layer over the real city, watchers, new ways to move, gadget bazaar, melting pot protocols, viral, icons awake, mystery and illusion.
- XV THE CITY THAT ANSWERS BACK (4967-5466): infrastructure with opinions, the weather machine, the night shift, the sixth borough, sacred geometry, the food chain, the market, the repair shop, the archive, and the close. The city finally answers.

## Canon you may lean on (do not invent new lore)
Thesis: being seen. Three marks: the eye flower is the city's attention, the blue evil eye is protection, the sigil is community. Running characters: the Painter of New Yorkers, the Adopted Squab who becomes a king, the Rat King and the Pigeon Queen, the Sigil Writer nobody has seen, the Gardener, the Collector (1866), the Guarantor (2666, the villain who earns redemption). Use them only when the brief names them.

## Output format
A single JSON object mapping the number as a string to the story string:
{"3067": "Sentence one. Sentence two lands bare", ...}
Every number in your input chunk must be present. Nothing else in the file.
