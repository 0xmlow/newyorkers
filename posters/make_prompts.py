"""make_prompts.py: one theatrical one-sheet prompt per pair in posters.json, for GPT Image 2.5 in Adobe Firefly.

The new-yorkers-movie-posters harness, expanded for the homophone series: the poster is a diptych in one sheet,
each with its own split (vertical, top and bottom, diagonal, cross section, back to back, same place two times,
one scene two readings, the ticket), and the title type is chosen to fit the joke. The model sets the type; the
MLow logo is composited afterwards (finish.py) into the quiet corner the prompt asks it to leave.
Writes todo.json: [{name, prompt, refs}] with the pair's gallery diptych and the eye flower as references.
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
TYPE = {
 "profit": "set in a heavy condensed sans serif like a stock ticker, PROFIT in ticker green and PROPHET in sign painter red",
 "brake": "set in the clean bold sans serif of subway signage, white on a black band, with a coloured route circle",
 "tawk": "set in gold Art Deco capitals like the lettering of the old terminal",
 "knew": "set in hand painted shop sign lettering, KNEW faded and cracked, NEW glossy and fresh",
 "miner": "set in a rough stencil like construction signage, MINER above ground, MINOR below",
 "idle": "set in pink and blue neon tube lettering",
 "morning": "MORNING in a cheerful deli awning script, MOURNING in a hand lettered memorial style on the gate",
 "cah": "set like a screaming tabloid front page headline in black condensed capitals",
 "peace": "set in groovy rounded lettering for PEACE and pizza box red script for PIECE",
 "heard": "set like a gossip magazine cover, big bold serif with a pink highlight",
 "one": "set in lottery ticket gold foil lettering with a starburst",
 "son": "set in a warm golden serif glowing like the sunset",
 "pair": "PAIR in a sneaker drop sans serif with a shine, PEAR in a hand written bodega price tag marker",
 "made": "set in an old Italian restaurant sign script in red and gold",
 "mail": "set in bold postal blue stencil with a rubber stamp texture",
 "in": "IN in pink nightclub neon, INN in a cozy hand painted hostel sign",
 "bare": "set in Times Square billboard capitals with a falling ticker red BEAR",
 "hair": "set in barbershop window gold leaf script",
 "peak": "set in tall Art Deco skyscraper capitals",
 "right": "RIGHT in a street sign white on red, WRITE in a typewriter face",
 "nose": "set in bodega awning capitals, red and yellow",
 "berry": "BERRY in juicy farm stand lettering, BURY in carved stone serif",
 "blew": "set in ballpark scoreboard lights, BLUE glowing blue",
 "dear": "DEAR in a warm deli sign script, DEER in a green road sign",
}
STYLE = ("Every person in the poster has a giant surreal flower instead of a head, like the flower in the reference: iridescent pink "
         "and white petals around one large human eye with a blue iris, dripping paint. No human faces. Painted in MLow's materially "
         "painted realism: thick oil impasto, fine contour lines that wrap around the actual forms, marbled paint and gravity drips, "
         "rich New York colour, cinematic controlled light, clear hierarchy and breathing room. The other reference is the gallery "
         "diptych of the same two New Yorkers: keep their wardrobe, props and setting.")
COPY = ("TYPOGRAPHY, spelled exactly: at the top centre a small imprint 'NEW YORKERS' and directly beneath it 'by MLow'. "
        "The title '{a} // {b}' large and readable in the lower quarter, {type}, with the double slash between the two words. "
        "One tagline in smaller type above the title: '{tag}'. A small credit near the bottom: 'AN MLOW VISION'. A small footer line: "
        "'NEW YORKERS • THE POSTER COLLECTION' and a small 'N3wyorkers.com'. Leave a quiet dark empty area in the bottom right corner, "
        "about a fifth of the poster width, with nothing in it, for a logo added later. No other text anywhere: no fake credits, no "
        "studio logos, no dates, no ratings, no real brands or logos.")
P = json.load(open(os.path.join(HERE, "posters.json")))
todo = []
for p in P:
    a, b = p["title"].split(" // ")
    prompt = (f"A finished theatrical movie poster, one-sheet, portrait 2:3, full bleed, for the NEW YORKERS homophone series. "
              f"{p['layout']} {STYLE} " + COPY.format(a=a, b=b, type=TYPE[p['id']], tag=p['tagline']))
    refs = [f"{p['id']}.jpg", "flower.jpg"]
    todo.append({"name": f"{p['n']:02d}_{p['id']}", "prompt": prompt, "refs": refs, "title": p["title"], "tagline": p["tagline"]})
json.dump(todo, open(os.path.join(HERE, "todo.json"), "w"), indent=1, ensure_ascii=False)
bad = [t["name"] for t in todo if any(ch in t["prompt"] for ch in "–—→")]
print(len(todo), "prompts", "DASHES IN" if bad else "no dashes", bad)
