"""Shot by shot prompts for the photoreal pass (Kling O3 Pro Edit on FLORA). One shared spine, one line per shot.
The model may change surface, light, atmosphere and lens. It may not change layout, the paintings, the sculptures or the signs."""
SPINE = ("Edit @Video1. Turn this into real live-action documentary footage shot on a 35 mm full frame camera in a real finished basement "
         "under a two family house in Queens, New York: photorealistic, physically accurate tungsten light from the practical bulbs that are already there, "
         "real materials with wear, dust in the air, subtle film grain. Keep the exact camera move, framing, layout, every object, every painting on the wall "
         "and its image, every sculpture's shape and colours, and every printed sign exactly where it is. No CGI look, no video game look, no new text, no people added. ")
SHOTS = [
  "A narrow wood paneled basement staircase seen from the steps, worn rubber treads, a bare bulb, the landing below with checkered vinyl and the orange shag den beyond.",
  "A small basement window at the top of a wood paneled wall, a rusted grate, grimy glass, daylight and a sidewalk with feet walking past beyond it.",
  "A 1970s finished basement den: knotty pine paneling, burnt orange shag carpet, a floral sofa under a clear plastic slipcover, a wood console TV, a lava lamp, a drop ceiling with water stains, toy sculptures on a shelf, framed paintings.",
  "A framed mirror on wood paneling that shows a different room: a peach spare bedroom with a floral bed and a brass lamp, real glass reflections and grime on the mirror.",
  "A low ceilinged basement card room: a folding table with poker chips, folding chairs, a pendant lamp, a cork board with pinned notes and postcards, framed paintings on pine paneling, vinyl floor tiles.",
  "A basement boiler room: painted cinder block, a cast iron boiler, exposed joists with pink insulation, galvanized steam pipes climbing the wall, a bare fluorescent tube, dusty concrete floor.",
  "A beige 1998 PC tower on a milk crate in a basement corner, crusted in pale blue crystal growths, lit by a small blue glow, whitewashed brick behind it.",
  "A very long narrow basement hallway with wood paneling, bare bulbs receding into darkness, framed paintings on both walls, checkered vinyl floor, fog at the far end.",
  "A cavernous brick basement room with a giant everything bagel the size of a car sitting in a lake of cream cheese, warm bulbs on long cords, a pixel cat flying around it.",
  "Inside the hole of a giant everything bagel: the crust curving overhead, sesame and poppy seeds the size of hands, cream cheese underfoot, warm light.",
  "A large painted sculpture of the Great Wave rising from a lake of cream cheese in a brick basement, warm bulbs, framed paintings on the far wall.",
  "A brick basement storage bay with a dozen grey rats dragging pizza slices across a dusty concrete floor, a crystal rat on a throne of milk crates, a bare bulb, a chest freezer with a black cat sitting on it.",
  "A white frosted walk-in freezer room, frost ridges on the floor, fluorescent tubes, a small blue mausoleum sculpture, framed paintings on frosted walls, cold mist.",
  "A basement laundry corner: a white washer and dryer, a cartoon table flip figurine on the washer, cinder block walls, concrete floor, a fluorescent tube.",
]
def prompt(i): return SPINE + SHOTS[i]
