#!/usr/bin/env python3
"""The sticker drawer for MLOWTAR's tickets.

MLow made two thousand object stickers in ChatGPT (NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300 and
NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300, transparent 1024 px PNGs in a blue and white delft
style with the drips). The ticket presses a few of them onto every slip, so this picks the New York sets a
fortune can use, shrinks each to 320 px, quantises it so the whole drawer stays small, and writes:

  assets/mlowtar/stickers/<id>.png
  assets/mlowtar/stickers.json     [[id, name, set, [themes]], ...]

Themes are the oracle's (match.js THEMES): a food question pulls bodega and bakery stickers, a train question
pulls the subway and taxi sets, and so on; "any" sets go on every ticket. Idempotent: existing files are kept,
so a second run only writes what is missing. Needs the two pack folders on this Mac; without them the drawer
already in assets/mlowtar/stickers stands and nothing is touched.
"""
import json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
PACKS = [os.path.join(ROOT, "NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300"), os.path.join(ROOT, "NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300")]
OUT = os.path.join(SITE, "assets", "mlowtar", "stickers"); IDX = os.path.join(SITE, "assets", "mlowtar", "stickers.json")
SIZE = 320

# set name (the catalog name with its trailing number stripped) -> themes it serves
SETS = {
    "MLow New York bodega counter objects": ["food", "home", "any"],
    "New York bakery production tools": ["food", "family"],
    "MLow New York deli kitchen tools": ["food", "work"],
    "NYC street vendor cart hardware": ["food", "move", "city"],
    "New York coffee shop tools": ["food", "work", "night"],
    "old ice cream parlor objects": ["food", "love", "family"],
    "Fulton-style fish market objects": ["food", "city"],
    "Chinatown kitchen utensils": ["food", "city"],
    "New York produce stand objects": ["food", "home"],
    "Coney Island amusement hardware": ["luck", "love", "night", "any"],
    "subway signal and trackside hardware": ["move", "work", "any"],
    "surreal subway relics, mystery clues and portal keys": ["move", "lost", "future"],
    "Open Eye Flower subway station witnesses": ["move", "night"],
    "yellow taxi garage tools and parts": ["move", "city"],
    "Open Eye Flower taxi relics": ["move", "luck"],
    "MLow New York fire escape objects": ["home", "love", "night"],
    "MLow New York rooftop and water tower hardware": ["home", "future", "city"],
    "brownstone apartment decor": ["home", "family"],
    "Open Eye Flower brownstone guardians": ["home", "family"],
    "Lower East Side tenement objects": ["home", "lost"],
    "Harlem jazz club ephemera": ["night", "art", "fame"],
    "Broadway theater backstage hardware": ["fame", "art", "work"],
    "modern NYC cocktail bar tools": ["night", "love"],
    "historic New York tavern objects": ["night", "lost"],
    "Diamond District jeweler bench tools": ["money", "love"],
    "NYC pawn shop objects": ["money", "lost"],
    "Midtown office relics": ["work", "money"],
    "letterpress print shop equipment": ["art", "work"],
    "SoHo loft studio objects": ["art", "home"],
    "photography darkroom tools": ["art", "lost"],
    "urban wildlife specimens found in NYC": ["city", "wander", "any"],
    "Central Park natural specimens": ["love", "wander", "family"],
    "NYC traffic control devices": ["move", "city"],
    "bridge maintenance hardware": ["future", "move", "love"],
    "Open Eye Flower bridge sentinels": ["future", "love"],
    "ferry terminal objects": ["move", "wander"],
    "New York winter street objects": ["wander", "lost"],
    "summer street objects in New York": ["wander", "luck"],
    "rainy day NYC objects": ["wander", "lost", "love"],
    "street fair objects": ["luck", "family", "food"],
    "NYC marathon objects": ["work", "future", "luck"],
    "blackout emergency objects": ["night", "lost"],
    "Open Eye Flower seed pods and pollen vessels": ["future", "any"],
    "Open Eye Flower petals becoming keys and locks": ["home", "love", "lost"],
    "Open Eye Flower ritual tools": ["luck", "future", "any"],
    "Open Eye Flower evidence objects for a mystery": ["lost", "luck"],
    "Open Eye Flower night garden specimens": ["night", "art"],
    "Open Eye Flower harbor blooms": ["wander", "future"],
    "sovereign Open Eye Flower crowns and botanical regalia": ["fame", "money", "any"],
}
BRAND = re.compile(r"^(Evil Eye clean sticker|MLow logo black clean sticker|Blossom \d+ signature clean sticker)")

def main():
    have = all(os.path.isdir(p) for p in PACKS)
    if not have:
        if os.path.exists(IDX): print("  mlowtar stickers: packs not on this Mac, the drawer stands"); return
        sys.exit("mlowtar stickers: the object packs are missing and no drawer exists yet")
    os.makedirs(OUT, exist_ok=True)
    rows, n_new, per_set = [], 0, {}
    for P in PACKS:
        cat = [c for c in os.listdir(P) if c.startswith("MASTER_CATALOG") and c.endswith(".json")][0]
        for it in json.load(open(os.path.join(P, cat))):
            base = re.sub(r"\s*\d+$", "", it["name"]).strip()
            themes = SETS.get(base)
            if themes is None and BRAND.match(it["name"]): themes, base = ["brand"], "brand"
            if themes is None: continue
            per_set[base] = per_set.get(base, 0) + 1
            if per_set[base] > (12 if base == "brand" else 8): continue        # eight a set keeps the drawer near 400
            src = os.path.join(P, it["root"], it["png"])
            if not os.path.exists(src): continue
            dst = os.path.join(OUT, f"{it['id']}.png")
            if not os.path.exists(dst):
                im = Image.open(src).convert("RGBA")
                bbox = im.getchannel("A").getbbox()
                if bbox: im = im.crop(bbox)
                im.thumbnail((SIZE, SIZE), Image.LANCZOS)
                q = im.quantize(colors=200, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
                q.save(dst, optimize=True); n_new += 1
            rows.append([it["id"], it["name"], base, themes])
    json.dump(rows, open(IDX, "w"), separators=(",", ":"))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith(".png"))
    print(f"  mlowtar stickers: {len(rows)} in the drawer ({n_new} new), {total // 1024} KB on disk")

if __name__ == "__main__": main()
