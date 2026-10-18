"""Every ImageGen prompt for BIGGER ON THE INSIDE, run through tools/imagegen.sh, six at a time.
python3 tools/concepts.py [name ...]   (no names: everything missing)"""
import os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
STYLE = ("Painted in the MLow Impermanent Vision style: fine topographic contour lines in electric cobalt and cyan that wrap around the "
         "architecture and bend toward the threshold, physical vertical paint drips of hot pink and violet, one watchful bone white Open Eye "
         "Flower with seven broad petals and a realistic blue iris, a small solitary human figure. Ink black and midnight navy darks, "
         "restrained copper light. Photoreal materials, cinematic, dense detail near the threshold, quiet dark fields elsewhere.")
ROOM = ("One point perspective view straight into a room through an opening, camera centred at eye height, the back wall dead centre "
        "and filling exactly the middle half of the frame, both side walls, floor and ceiling converging evenly to it, no window frame, "
        "no glass, no people, no text. ")
J = []
def job(folder, name, shape, prompt): J.append((folder, name, shape, prompt))
# room concepts
job("concepts", "02_bodega", "landscape", "Concept art, interior of a tiny New York corner bodega that is impossibly bigger on the inside: a one metre wide front door opens onto a single aisle that runs on for a kilometre to a vanishing point, shelves stocked with chips, coffee, cat food, and framed paintings between the products, a bodega cat on the counter, a deli counter with an everything bagel, handwritten signs WE HAVE IT and CAT NOT FOR SALE, fluorescent tubes receding forever. " + STYLE)
job("concepts", "03_walkup", "portrait", "Concept art, a narrow New York tenement walk-up stairwell that loops into itself like a Penrose staircase, worn marble steps, black iron railings, apartment doors with brass numbers 5A 5B on every landing, framed paintings hung on the landings, a floor sign that reads FLOOR 5 on every floor, the stair spiralling up into an impossible repeating void. " + STYLE)
job("concepts", "04_studio", "landscape", "Concept art, a 900 square foot New York studio apartment built as an Ames room optical illusion: from the peephole it looks like a normal rectangular room with checkerboard floor, but one bronze figure standing in the left corner is a giant and an identical figure in the right corner is tiny, a Murphy bed, a radiator, a bathtub in the kitchen, a single window. " + STYLE)
job("concepts", "05_laundromat", "landscape", "Concept art, a New York laundromat at night where every round dryer window shows a different impossible room, and one giant open dryer drum is a rotating vortex tunnel you walk through on a narrow steel bridge, the drum painted with spinning contour stripes, plastic chairs, a change machine, folded laundry, fluorescent light. " + STYLE)
job("concepts", "06_subway", "landscape", "Concept art, inside a New York subway car that slowly rolls all the way around its long axis while the rider stays upright, poles and orange seats and straphangers wheeling overhead, advertising cards above the windows replaced by framed paintings, the tunnel lights streaking past the windows, a map on the wall. " + STYLE)
job("concepts", "07_rooftop", "landscape", "Concept art, a New York tar beach rooftop at night with a wooden water tower, where the whole city curls up and over the sky like a rolled up map, streets and avenues and yellow cabs hanging upside down overhead, the Empire State Building pointing down, a giant Open Eye Flower rising like a moon over the horizon. " + STYLE)
# window interiors for the interior mapping shader (every lit window on the block)
for name, what in [
  ("win_library", "a vast cathedral library with spiral galaxies painted on the vault, warm lamplight"),
  ("win_aquarium", "a flooded living room that has become a deep sea aquarium with glowing jellyfish, armchair and lamp underwater"),
  ("win_ballroom", "a gilded ballroom with chandeliers and a polished parquet floor, empty, glowing"),
  ("win_jungle", "a New York kitchen overgrown into a tropical jungle with a waterfall, fridge and stove half hidden in leaves"),
  ("win_snow", "a small bedroom whose far wall opens onto an endless snowfield under a pale moon, bed and radiator in the foreground"),
  ("win_pool", "an indoor swimming pool with turquoise water and white tile in a tiny walk-up apartment, a single lounge chair"),
  ("win_desert", "a living room with sand dunes rolling through it to a desert horizon at dusk, a couch half buried"),
  ("win_platform", "an empty subway platform inside an apartment, white tile walls, a train headlight in the far tunnel"),
  ("win_greenhouse", "a glass greenhouse full of white Open Eye Flowers with blue irises, all turned to look out"),
  ("win_studio", "a painter's studio with a huge canvas, paint drips on the floor, one bare bulb, night"),
  ("win_disco", "a mirror ball disco loft with colored light, empty dance floor, 1978"),
  ("win_hall", "an endless hallway of identical apartment doors under flickering fluorescent light")]:
    job("plates", name, "square", ROOM + "The room: " + what + ". Photoreal, cinematic lighting, rich detail.")
# depth plates
job("plates", "skyline", "landscape", "Photoreal night view straight down a Lower East Side street from eye level toward the Manhattan Bridge and the lit Midtown skyline far away, wet street glistening, tenements on both sides cropped at the edges, a distant Open Eye Flower in the sky like a moon, ink black sky. No people, no text.")
job("plates", "aisle_end", "landscape", "Photoreal one point perspective down an infinitely long bodega aisle, fluorescent tubes and shelves of colorful products receding to a bright vanishing point, white linoleum floor, the aisle centred and perfectly symmetrical. No people, no text.")
job("plates", "tunnel", "landscape", "Photoreal subway tunnel at speed seen from a train window, blurred work lights streaking past, dark tiles, cables, motion blur, ink black and cyan. No text.")
job("plates", "contour_wall", "square", "Seamless tileable texture, flat front view, dark soot stained red brick wall with fine glowing topographic contour lines in electric cobalt and cyan painted across it following the bricks, a few hot pink paint drips running down. Even lighting, no perspective, no shadows from outside, tileable edges.")
names = set(sys.argv[1:])
todo = [j for j in J if (not names or j[1] in names) and not os.path.exists(os.path.join(ROOT, j[0], j[1] + ".png"))]
print(len(todo), "to make")
def run(j):
    folder, name, shape, prompt = j
    r = subprocess.run([os.path.join(HERE, "imagegen.sh"), os.path.join(ROOT, folder), name, shape, prompt], capture_output=True, text=True)
    print(name, r.stdout.strip()[-80:], flush=True)
with ThreadPoolExecutor(6) as ex: list(ex.map(run, todo))
