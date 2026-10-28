"""build.py: assemble THE PIGEONHOLE into site/.

  python3 tools/build.py            # everything: art, stickers, textures, plates, depth, models, bundle
  python3 tools/build.py --js       # only rebundle the code and rewrite index.html
  python3 tools/build.py --assets   # everything except the depth pass (fast when only art or stickers changed)

Inputs, all read only:
  gen/raw/pigeonhole_*.png|jpg   the generated plates, materials and graphics (tools/prompts.json, made in Firefly)
  NEW YORKERS SITE/api/pieces.json and assets/t/   the census: which New Yorkers hang in which room (ROOM_ART)
  the 301 to 2300 sticker packs  transparent stickers, packed into atlases (STICKER_GROUPS)
  ON LOCATION site/assets/glb    the asset pack: Tripo cast and branded Poly Haven props, Draco compressed
Every derived file is a new file under site/assets; nothing upstream is touched.
"""
import csv, glob, json, os, re, shutil, subprocess, sys, time, random
import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); DESK = os.path.dirname(ROOT)
SITE_REPO = os.path.join(DESK, "NEW YORKERS SITE"); MUSEUM = os.path.join(SITE_REPO, "_build", "museum")
ONLOC = os.path.join(DESK, "ON LOCATION 2026-10-10", "site")
OUT = os.path.join(ROOT, "site"); A = os.path.join(OUT, "assets"); RAW = os.path.join(ROOT, "gen", "raw")
PACKS = [(os.path.join(DESK, "NEW_YORKERS_1000_OBJECT_EXPANSION_301-1300"), "MASTER_CATALOG_301-1300.csv"),
         (os.path.join(DESK, "NEW_YORKERS_NEXT_1000_EYE_FLOWER_MLOW_BLOSSOM_1301-2300"), "MASTER_CATALOG_1301-2300.csv")]

# which New Yorkers hang where: words in the title or story first, then neighbourhoods, never a piece twice
ROOM_ART = {
    "car":      (["subway", "train", "commut", "platform", "sleep", "dream", "night shift", "3 a.m", "last stop", "conductor"], ["Long Island City", "Astoria"], 14),
    "platform": (["station", "tunnel", "token", "metrocard", "turnstile", "busker", "wait"], ["Sunnyside", "Woodside"], 12),
    "bodega":   (["bodega", "deli", "corner store", "cat", "lotto", "coffee", "sandwich", "grocer", "egg and cheese"], ["Jackson Heights", "Corona", "Elmhurst"], 16),
    "cooler":   (["beer", "cold", "ice", "snow", "beach", "rockaway", "harbor", "ferry", "liberty"], ["Rockaway Beach", "Coney Island"], 10),
    "stairs":   (["stair", "stoop", "basement", "cellar", "super", "boiler", "landlord"], ["Bushwick", "Ridgewood"], 12),
    "nave":     (["pigeon", "bird", "feather", "wing", "roof", "coop"], ["Greenpoint", "Williamsburg"], 16),
    "crop":     (["bagel", "pizza", "slice", "hot dog", "pretzel", "knish", "dumpling", "halal", "fries", "food", "chicken"], ["Chinatown", "Flushing"], 14),
    "wing":     (["fly", "flight", "sky", "air", "wind", "kite", "jump", "fall"], ["Washington Heights", "Inwood"], 16),
    "heart":    (["love", "heart", "kiss", "wedding", "valentine", "romance", "dance"], ["Harlem", "East Harlem"], 14),
    "dome":     (["map", "home", "lost", "find", "compass", "neighbo", "block", "borough"], ["Crown Heights", "Flatbush", "Bedford-Stuyvesant", "Sunset Park", "Bay Ridge", "Upper West Side", "Mott Haven", "Jamaica"], 40),
    "museum":   (["museum", "gallery", "art", "paint", "frame", "curator", "collector", "guard"], ["Chelsea", "Upper East Side"], 14),
    "shop":     (["souvenir", "gift", "snow globe", "tourist", "postcard", "i love", "shop"], ["Midtown", "Financial District"], 12),
}
# sticker families by room theme (name substrings in the pack catalogues); each group packs into its own atlases
STICKER_GROUPS = {
    "eye":    (["open eye flower"], 96),
    "mlow":   (["mlow logo", "blossom", "evil eye", "sovereign"], 32),
    "bodega": (["bodega", "deli", "coffee", "grocer", "lotto", "candy", "snack", "cigar", "newsstand", "bakery", "laundromat"], 64),
    "subway": (["subway", "taxi", "transit", "metro", "bus ", "train", "turnstile", "token", "signal"], 64),
    "museum": (["museum", "archive", "gallery", "frame", "library", "map", "compass"], 48),
    "street": (["fire", "hydrant", "pigeon", "bird", "roof", "water tower", "street", "sanitation", "park", "bench", "pizza", "hot dog", "pretzel", "halal", "cart"], 64),
}
SEAMLESS = ["t_bodega_floor", "t_subway_floor", "t_subway_wall", "t_feather", "t_velvet", "t_crop", "t_terrazzo", "t_stickerwall", "t_tile", "t_ceiling", "t_receipts"]
GLBS = ["pigeon", "cat", "rat", "hydrant", "h_subway_car", "pigeonlady", "boombox", "hotdog", "mlowtar", "lamppost", "mailbox", "bench", "gull", "dog", "popcorn",
        "ph_CashRegister_01", "ph_Shelf_01", "ph_WetFloorSign_01", "ph_cardboard_box_01", "ph_plastic_crate_01", "ph_metal_trash_can", "ph_wooden_crate_01", "ph_wall_clock",
        "ph_Television_01", "ph_bananas", "ph_food_apple_01", "ph_lemon", "ph_croissant", "ph_hamburger_buns", "ph_cigarette_pack", "ph_vintage_radio_transceiver",
        "ph_mounted_fluorescent_lights", "ph_ceiling_fan", "ph_steel_frame_shelves_03", "ph_wooden_display_shelves_01", "ph_trashbag", "ph_street_rat", "ph_marble_bust_01",
        "ph_fancy_picture_frame_01", "ph_ornate_mirror_01", "ph_Chandelier_02", "ph_brass_vase_01", "ph_bronze_whale_statue", "ph_gothic_statue", "ph_vintage_grandfather_clock_01",
        "ph_potted_plant_02", "ph_Barrel_01", "ph_hand_truck", "ph_metal_stool_01", "ph_rubber_duck_toy", "ph_magnifying_glass_01", "ph_binoculars", "ph_mantel_clock_01",
        "ph_modular_airduct_rectangular_01", "ph_pull_chain_light_socket", "ph_industrial_wall_sconce", "ph_caged_hanging_light", "ph_fire_alarm", "ph_korean_fire_extinguisher_01",
        "ph_vintage_suitcase", "ph_postcard_set_01", "ph_tea_set_01", "ph_round_spectacles", "ph_wicker_basket_01", "ph_yellow_onion", "ph_baseball_01", "ph_boombox"]

def clone(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    if subprocess.call(["cp", "-c", src, dst], stderr=subprocess.DEVNULL) != 0: shutil.copy2(src, dst)

def raw(name):
    for ext in (".png", ".jpg"):
        f = os.path.join(RAW, "pigeonhole_" + name + ext)
        if os.path.exists(f): return f
    return None

def art():
    P = [p for p in json.load(open(os.path.join(SITE_REPO, "api", "pieces.json"))) if p.get("image")]
    used, cast = set(), {}
    def ok(p): return p["n"] not in used and os.path.exists(os.path.join(SITE_REPO, "assets", p["image"].split("/assets/")[-1]))
    for room, (words, hoods, n) in ROOM_ART.items():
        pick = []
        txt = lambda p: (p.get("title", "") + " " + (p.get("story") or "")).lower()
        for w in words:
            for p in sorted(P, key=lambda p: p["n"]):
                if len(pick) >= n * 2 // 3: break
                if ok(p) and re.search(r"\b" + re.escape(w), txt(p)): used.add(p["n"]); pick.append(p)
        for h in hoods:
            hp = [p for p in P if p.get("neighborhood") == h and ok(p)]
            random.Random(room + h).shuffle(hp)
            for p in hp:
                if len(pick) >= n: break
                used.add(p["n"]); pick.append(p)
        cast[room] = []
        for p in pick:
            f = p["image"].split("/assets/")[-1]
            clone(os.path.join(SITE_REPO, "assets", f), os.path.join(A, "art", os.path.basename(f)))
            cast[room].append({"n": p["n"], "t": p["title"], "h": p.get("neighborhood") or "", "b": p.get("borough", ""), "f": os.path.basename(f), "s": (p.get("story") or "")[:180]})
    print("art:", {k: len(v) for k, v in cast.items()}, "total", sum(len(v) for v in cast.values()))
    return cast

def stickers():
    rows = []
    for root, cat in PACKS:
        for r in csv.DictReader(open(os.path.join(root, cat))):
            f = os.path.join(root, r["root"], r["png"])
            if os.path.exists(f): rows.append((r["id"], r["name"], f))
    out, groups, taken = {}, {}, set()
    os.makedirs(os.path.join(A, "stickers"), exist_ok=True)
    CELL, N = 256, 8
    for g, (words, n) in STICKER_GROUPS.items():
        pick = [r for r in rows if r[0] not in taken and any(w in r[1].lower() for w in words)]
        random.Random(g).shuffle(pick); pick = pick[:n]
        for r in pick: taken.add(r[0])
        groups[g] = []
        for a in range(0, len(pick), N * N):
            name = f"{g}{a // (N * N)}"
            sheet = Image.new("RGBA", (CELL * N, CELL * N), (0, 0, 0, 0))
            for k, (sid, nm, f) in enumerate(pick[a:a + N * N]):
                im = Image.open(f).convert("RGBA"); bb = im.getbbox()
                if bb: im = im.crop(bb)
                aw, ah = im.size; s = (CELL - 8) / max(aw, ah); im = im.resize((max(1, round(aw * s)), max(1, round(ah * s))), Image.LANCZOS)
                cx, cy = (k % N) * CELL, (k // N) * CELL
                sheet.paste(im, (cx + (CELL - im.width) // 2, cy + (CELL - im.height) // 2), im)
                # UVs of the square cell; aspect kept separately so the card is cut to the art
                out["s" + sid] = {"a": name, "u": (k % N) / N + (CELL - im.width) / 2 / (CELL * N), "v": 1 - (k // N + 1) / N + (CELL - im.height) / 2 / (CELL * N),
                                  "w": im.width / (CELL * N), "h": im.height / (CELL * N), "aw": im.width, "ah": im.height, "n": nm}
                groups[g].append("s" + sid)
            sheet.save(os.path.join(A, "stickers", name + ".png"), optimize=True)
    print("stickers:", {k: len(v) for k, v in groups.items()})
    return out, groups

def seamless(im):
    """Make a generated texture tile: offset by half and cross fade the seam with a feathered cross mask."""
    a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]
    b = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
    yy, xx = np.mgrid[0:h, 0:w]; dx = np.abs(xx - w / 2) / (w / 2); dy = np.abs(yy - h / 2) / (h / 2)
    m = np.clip((np.maximum(dx, dy) - 0.55) / 0.35, 0, 1)[..., None]   # 1 near the image border, where the original seam is
    return Image.fromarray((a * (1 - m) + b * m).astype(np.uint8))

def pbr(name, size=1024):
    f = raw(name)
    if not f: print("missing", name); return
    im = Image.open(f).convert("RGB"); s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((size, size), Image.LANCZOS)
    im = seamless(im)
    os.makedirs(os.path.join(A, "tex"), exist_ok=True)
    im.save(os.path.join(A, "tex", name[2:] + "_c.jpg"), quality=88, optimize=True)
    # height from blurred luminance (an approximation: dark grout reads low, light tile high), Sobel to a normal
    L = np.asarray(ImageOps.grayscale(im).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    gx = (np.roll(L, -1, 1) - np.roll(L, 1, 1)) * 2.2; gy = (np.roll(L, -1, 0) - np.roll(L, 1, 0)) * 2.2
    n = np.dstack([-gx, gy, np.ones_like(L)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(A, "tex", name[2:] + "_n.jpg"), quality=90)
    r = 0.55 + (0.5 - L) * 0.5
    Image.fromarray((np.clip(r, 0.12, 0.95) * 255).astype(np.uint8)).save(os.path.join(A, "tex", name[2:] + "_r.jpg"), quality=85)

def graphics():
    os.makedirs(os.path.join(A, "g"), exist_ok=True)
    for f in glob.glob(os.path.join(RAW, "pigeonhole_g_*")):
        n = re.sub(r"^pigeonhole_|\.(png|jpg)$", "", os.path.basename(f))
        im = Image.open(f).convert("RGB"); im.thumbnail((2048, 2048), Image.LANCZOS)
        im.save(os.path.join(A, "g", n + ".jpg"), quality=86, optimize=True, progressive=True)

def plates(force=False):
    os.makedirs(os.path.join(A, "plates"), exist_ok=True); os.makedirs(os.path.join(A, "depth"), exist_ok=True)
    todo = []
    for f in sorted(glob.glob(os.path.join(RAW, "pigeonhole_p_*"))):
        n = re.sub(r"^pigeonhole_|\.(png|jpg)$", "", os.path.basename(f))
        if force or not os.path.exists(os.path.join(A, "depth", n + ".png")) or os.path.getmtime(f) > os.path.getmtime(os.path.join(A, "depth", n + ".png")): todo.append((n, f))
    if not todo: return
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    M = "depth-anything/Depth-Anything-V2-Small-hf"
    proc = AutoImageProcessor.from_pretrained(M); model = AutoModelForDepthEstimation.from_pretrained(M).eval()
    for n, f in todo:
        im = Image.open(f).convert("RGB")
        with torch.no_grad(): out = model(**proc(images=im, return_tensors="pt")).predicted_depth
        d = torch.nn.functional.interpolate(out[None], size=(im.height, im.width), mode="bicubic")[0, 0].numpy()
        lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5); d = np.clip((d - lo) / (hi - lo), 0, 1)
        dm = Image.fromarray((d * 255).astype(np.uint8)).resize((1024, round(1024 * im.height / im.width)), Image.LANCZOS)
        dm.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(A, "depth", n + ".png"))
        w = 2048 if im.width >= im.height else 1400
        im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(os.path.join(A, "plates", n + ".jpg"), quality=86, optimize=True, progressive=True)
        print("plate", n, im.size)

def statics():
    for p in GLBS:
        src = os.path.join(ONLOC, "assets", "glb", p + ".glb")
        if os.path.exists(src): clone(src, os.path.join(A, "glb", p + ".glb"))
        else: print("no model", p)
    # the cast as crowd figures (tools/crowd_pass.py, then Draco): src/crowd.js
    for f in sorted(os.listdir(os.path.join(ROOT, "gen", "crowd"))):
        if f.endswith(".glb"): clone(os.path.join(ROOT, "gen", "crowd", f), os.path.join(A, "glb", f))
    # the same cast rigged (UPGRADE ALL ROOMS 2026-10-28/rig): skinned, no Draco, src/rig.js
    for f in sorted(os.listdir(os.path.join(ROOT, "gen", "rig"))):
        if f.endswith(".glb"): clone(os.path.join(ROOT, "gen", "rig", f), os.path.join(A, "glb", f))
    for f in ("draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"):
        clone(os.path.join(ONLOC, "assets", "draco", f), os.path.join(A, "draco", f))
    clone(os.path.join(ONLOC, "assets", "env", "night.hdr"), os.path.join(A, "env", "night.hdr"))
    for f in os.listdir(os.path.join(ONLOC, "fonts")): clone(os.path.join(ONLOC, "fonts", f), os.path.join(OUT, "fonts", f))
    clone(os.path.join(SITE_REPO, "assets", "brand", "logos", "n3w-01.png"), os.path.join(A, "logo.png"))
    clone(os.path.join(ROOT, "gen", "open-eye-flowers.png"), os.path.join(A, "eyeflowers.png")); clone(os.path.join(ROOT, "gen", "flower.png"), os.path.join(A, "flower.png"))

def count_eggs():
    txt = "\n".join(open(f).read() for f in glob.glob(os.path.join(ROOT, "src", "**", "*.js"), recursive=True))
    return sorted(set(re.findall(r"egg\('(\w+)'", txt)))

def data(cast, stk, groups):
    eggs = count_eggs()
    open(os.path.join(A, "data.js"), "w").write("window.EGG_N=" + str(len(eggs)) + ";\nwindow.CAST=" + json.dumps(cast, ensure_ascii=False, separators=(",", ":")) +
        ";\nwindow.STICKERS=" + json.dumps(stk, separators=(",", ":")) + ";\nwindow.STICKER_GROUPS=" + json.dumps(groups, separators=(",", ":")) + ";\n")
    print("eggs:", len(eggs))

def bundle(out=None):
    """out: a dev directory (parallel builders each bundle into their own; assets other than the bundle are symlinked)."""
    OUTD = out or OUT; OA = os.path.join(OUTD, "assets")
    if out:
        os.makedirs(OA, exist_ok=True)
        for f in os.listdir(A):
            if f in ("gallery.js",): continue
            d = os.path.join(OA, f)
            if not os.path.lexists(d): os.symlink(os.path.join(A, f), d)
        for f in ("fonts",):
            if not os.path.lexists(os.path.join(OUTD, f)): os.symlink(os.path.join(OUT, f), os.path.join(OUTD, f))
    env = dict(os.environ, NODE_PATH=os.path.join(MUSEUM, "node_modules"))
    r = subprocess.run([os.path.join(MUSEUM, "node_modules", ".bin", "esbuild"), os.path.join(ROOT, "src", "main.js"), "--bundle", "--format=esm",
                        "--minify", "--target=es2022", f"--outfile={os.path.join(OA, 'gallery.js')}", "--log-level=warning"], env=env)
    if r.returncode: sys.exit("esbuild failed")
    # the stills (tools/shot.py with &clean) and the poster ride along with the page
    os.makedirs(os.path.join(OUTD, "shots"), exist_ok=True)
    for f in glob.glob(os.path.join(ROOT, "shots", "*.jpg")): clone(f, os.path.join(OUTD, "shots", os.path.basename(f)))
    if os.path.exists(os.path.join(ROOT, "shots", "diorama.jpg")): clone(os.path.join(ROOT, "shots", "diorama.jpg"), os.path.join(OA, "poster.jpg"))
    html = open(os.path.join(ROOT, "src", "shell.html")).read().replace("@@V@@", time.strftime("%Y%m%d%H%M%S"))
    bad = re.findall(r"[–—→]", html)
    if bad: sys.exit(f"house rule: dashes or arrows in the page: {bad}")
    open(os.path.join(OUTD, "index.html"), "w").write(html)
    # on phones this halves any image texture over 512 at upload, so the page fits the memory iOS gives a tab
    clone(os.path.join(ROOT, "src", "phone-gpu.js"), os.path.join(OUTD, "phone-gpu.js"))
    print("bundle:", os.path.getsize(os.path.join(OA, "gallery.js")) // 1024, "KB", "into", OUTD)

if __name__ == "__main__":
    if "--js" not in sys.argv:
        statics(); cast = art(); stk, groups = stickers()
        for t in SEAMLESS: pbr(t)
        graphics()
        if "--assets" not in sys.argv: plates("--force" in sys.argv)
        data(cast, stk, groups)
    else:
        # keep the data, recount the eggs
        d = open(os.path.join(A, "data.js")).read(); eggs = count_eggs()
        open(os.path.join(A, "data.js"), "w").write(re.sub(r"window\.EGG_N=\d+;", f"window.EGG_N={len(eggs)};", d))
    bundle(os.path.abspath(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None)
