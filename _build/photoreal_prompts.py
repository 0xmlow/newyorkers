"""Shot by shot prompts for the photoreal pass (FLUX 3 Video Edit on FLORA). One shared spine, one line per shot."""
SPINE = ("Turn this into real live-action film footage shot on an ARRI Alexa 65 with a 35 mm anamorphic lens, photorealistic, "
         "physically accurate light, real materials, subtle film grain and natural lens flare. Keep the exact camera move, framing, layout, "
         "every object, every sculpture's shape and colors, and every printed card and poster image exactly where it is. "
         "No CGI look, no cartoon, no video game look, no new text, no people added. ")
SHOTS = [
  "Golden hour drone shot over real New York Harbor approaching a small art island: real choppy harbor water with sun glints, a weathered timber pier, a real ferry boat, the Manhattan skyline in warm haze.",
  "A colossal hand painted fiberglass sculpture of the Great Wave rising out of real harbor water at golden hour, spray and foam, real sky, Manhattan skyline behind.",
  "A sweeping plaza paved with hundreds of real printed art cards laid like tiles on a hill, real grass, glossy fiberglass sculptures, a real park in afternoon sun.",
  "Rows of monumental glossy painted resin sculptures on real stone plinths across a real lawn, sharp afternoon sunlight and soft shadows.",
  "Inside a real converted brick and concrete factory hall with polished concrete floors, framed art prints on the walls, daylight through high windows.",
  "Inside a real pavilion whose walls are a pink sculpted plaster brain surface, gallery spotlights on framed prints, a polished floor.",
  "A real black matte steel lighthouse shaped like a hardware wallet standing in real harbor water at sunset, a small glowing LCD screen, sea spray.",
  "Inside a real marble bank vault gallery with brass fittings and framed artworks, museum lighting, polished marble floor.",
  "A real giant circular portal of polished pale blue steel standing on a real lawn, bright midday sun, the art island beyond.",
  "A real giant ferris wheel at sunset carrying framed art prints, real steel spokes and cables, warm sky, real grass and paths below.",
  "A long real concrete bunker corridor hung with framed posters, practical fluorescent light, dust in the air, polished concrete floor.",
  "A real neoclassical white marble bank with fluted columns on a lawn, morning sun, a real brass plaque, framed art inside.",
  "A real outdoor sculpture garden at midday: a huge printed mountain landscape billboard, real lawn, glossy sculptures, harbor beyond.",
  "A long real white gallery pavilion lined with framed painted portraits of New Yorkers, morning sun, real lawn and paving.",
  "Inside a real New York bodega built of red brick with real shelves, a deli counter, framed art cards on the walls, fluorescent light.",
  "A real beach at dawn on New York Harbor, wet sand, gentle surf, a big printed welcome billboard, palm trees, first warm light.",
  "A monumental real stone and bronze statue of a pixel character standing in the harbor like the Statue of Liberty at sunset, waves breaking on its base.",
  "Real aerial helicopter footage of a round art island in New York Harbor as day turns to night, real water, real city lights coming on.",
  "Real night footage over New York Harbor during a fireworks show, real fireworks bursting, reflections on black water, city lights, smoke drifting.",
]
def prompt(i): return SPINE + SHOTS[i]
def kling(i): return 'Edit @Video1. ' + SPINE + SHOTS[i]
