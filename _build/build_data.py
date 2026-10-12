#!/usr/bin/env python3
"""THE SPIRAL: data and atlases for the walkable SKELLY CUP gallery.

Reads the Seed Ledger (MARBLE RUN x NEW YORKERS 2026-10-08/ledger, Bryan Brinkman's marblerun.fun archived),
the site's published SKELLY art (NEW YORKERS SITE/_build/skelly: race_art, champions, holders, cast) and the
SKELLY CUP trading cards MLow made in ChatGPT (~/.codex/generated_images), and writes into site/assets:

  data.json            every tournament, every race in bracket order, its painting if one exists, the champion,
                       the champion's path, the 100 marbles with rider, holder and lifetime stats, the cards
  atlas/T<n>.jpg       one atlas per painted tournament: 25 race tiles + the champion tile, 320x180 each,
                       so the whole tower draws from 26 textures and only the turns near you load full size
  atlas/riders.jpg     the 100 census riders, 10x10 at 200 px
  atlas/holders.jpg    the 98 holder paintings, 10x10 at 256x144
  atlas/cards.jpg      the 42 cards, 7x6, for the mobile that hangs in the void
  cards/c<n>.jpg       42 trading cards at 720 px tall
  film/skelly-cup.mp4  the 60 s commercial at 960x540, small enough for Pages

Paintings themselves are not copied: the page reads them from the site's own assets (../ on n3wyorkers.com,
https://n3wyorkers.com/assets/ when opened on its own). Rerun after ledger.py and after new paintings publish.
"""
import json, os, glob, subprocess, time
from PIL import Image, ImageOps

H = os.path.dirname(os.path.abspath(__file__)); GAL = os.path.dirname(H); ROOT = os.path.dirname(GAL)
SITE = os.path.join(ROOT, "NEW YORKERS SITE"); RUN = os.path.join(ROOT, "MARBLE RUN x NEW YORKERS 2026-10-08")
OUT = os.path.join(GAL, "site", "assets")
J = lambda p: json.load(open(p))

LANE_BORO = {"RED": "Brooklyn", "BLUE": "Manhattan", "YELLOW": "Queens", "GREEN": "Staten Island", "CREAM": "The Bronx"}
ORDER = [f"heats:{i}" for i in range(20)] + [f"semis:{i}" for i in range(4)] + ["final:0"]
TILE = (320, 180)

# The trading cards, by position in the two ChatGPT sessions (contact sheet checked 2026-10-11). Banners and the
# two honorary artist cards in the same sessions are not SKELLY CUP and stay out. Series = the three card designs.
CARD_SESSIONS = ["01a11b40-e1d1-7510-8660-4ee3ec52db2d", "01a11ee3-1e2f-7eb2-91c6-204c33ad2bea", "01a120a8-aade-7671-9eac-7f4ae33eea67"]
CARDS = {12: "OScoralshellfish", 13: "666k", 14: "Double Deuce", 15: "Adamtastic", 16: "alpurrt", 17: "balón", 18: "BatSoupYum",
         19: "balón", 20: "BatSoupYum", 21: "Batzdu", 22: "blocknoob", 23: "BearSurvivor", 24: "Blondie23LMD007", 25: "Bryan Brinkman",
         26: "Riding Solo", 27: "chikai", 28: "chikai", 29: "clay", 30: "Bryan Brinkman", 31: "BearSurvivor", 32: "PERILOUS_",
         33: "Bryan Brinkman", 34: "Raptornews", 35: "Snowfro", 36: "olegs13", 37: "PeaceLandBread", 38: "LapsusEth", 39: "Shatt_Eth",
         40: "Ojedasbodega", 41: "KosherCowboy", 42: "TGuyot", 43: "pica_pica", 44: "Bryan Brinkman", 45: "icculus_library",
         46: "RCIV", 47: "colorblock", 48: "funghiball", 49: "punks_vault", 50: "Coldie", 51: "Sweet28feet", 52: "jamo_the_cat",
         53: "Patron #029"}


def site_file(rel):  # "assets/skelly/x.jpg" or a full n3wyorkers URL -> local path in the site repo
    rel = rel.replace("https://n3wyorkers.com/", "")
    return os.path.join(SITE, rel)


def rel_asset(rel):  # what the page asks for, relative to the site's assets/ folder
    return rel.replace("https://n3wyorkers.com/", "").replace("assets/", "", 1)


def tile(path, size):
    im = Image.open(path).convert("RGB")
    return ImageOps.fit(im, size, Image.LANCZOS)


def main():
    os.makedirs(os.path.join(OUT, "atlas"), exist_ok=True)
    races = J(os.path.join(RUN, "ledger", "races.json"))
    champs = J(os.path.join(RUN, "ledger", "champions.json"))
    stats = J(os.path.join(RUN, "ledger", "marbles.json"))
    art = {(a["t"], f"{a['rnd']}:{a['i'] - 1}"): a for a in J(os.path.join(SITE, "_build", "skelly", "race_art.json"))}
    portraits = {c["tournamentId"]: c for c in J(os.path.join(SITE, "_build", "skelly", "champions.json"))}
    holders = J(os.path.join(SITE, "_build", "skelly", "holders.json"))
    cast = {c["marbleId"]: c for c in J(os.path.join(RUN, "cast.json"))["cast"]}

    by_t = {}
    for r in races:
        by_t.setdefault(r["tournamentId"], {})[r["raceKey"]] = r
    hist = {h["tournamentId"]: h for h in champs["history"]}

    tours = []
    for tid in sorted(set(by_t) | set(hist)):
        h = hist.get(tid); known = by_t.get(tid, {}); rows = []
        for key in ORDER:
            r = known.get(key); a = art.get((tid, key)); row = {"k": key}
            res = (r or {}).get("results") or []
            if res:
                row.update(w=res[0]["marbleName"], wid=res[0]["marbleId"], lane=res[0]["lane"], tm=round(res[0]["timeSec"], 2),
                           f=[x["marbleId"] for x in res])
            elif a:
                row.update(w=a["winner"], wid=a["wid"], lane=a["lane"], tm=round(a["time"], 2))
            if r: row.update(seed=r["raceSeed"], track=r["trackSeed"], blown=len(r.get("clientSeeds") or []))
            elif a: row.update(seed=a["seed"])
            if a: row.update(art=rel_asset(a["f"]), title=a["title"])
            rows.append(row)
        t = {"id": tid, "races": rows}
        if h:
            t["champ"] = {"id": h["champion"]["id"], "n": h["champion"]["name"], "title_no": h.get("titleNumber"),
                          "hex": h.get("masterSeedHex", ""), "done": h.get("completedAt"),
                          "path": [p["raceKey"] for p in h.get("path", [])]}
        p = portraits.get(tid)
        if p:
            t["portrait"] = {"img": rel_asset(p["image"]), "thumb": rel_asset(p["thumb"]), "title": p["title"],
                             "rider": p.get("rider", ""), "piece": p.get("piece")}
        tours.append(t)

    # Atlases: slots 0..24 races, 25 champion. Slots with no painting stay black; the page paints them as the wet tape.
    for t in tours:
        if not t.get("portrait") and not any(r.get("art") for r in t["races"]):
            continue
        at = Image.new("RGB", (TILE[0] * 5, TILE[1] * 6), (12, 12, 14)); painted = []
        for i, r in enumerate(t["races"]):
            if r.get("art"):
                at.paste(tile(os.path.join(SITE, "assets", r["art"]), TILE), ((i % 5) * TILE[0], (i // 5) * TILE[1])); painted.append(i)
        if t.get("portrait"):
            at.paste(tile(os.path.join(SITE, "assets", t["portrait"]["img"]), TILE), (0, 5 * TILE[1])); painted.append(25)
        at.save(os.path.join(OUT, "atlas", f"T{t['id']}.jpg"), quality=82, optimize=True)
        t["atlas"] = f"atlas/T{t['id']}.jpg"; t["painted"] = painted

    marbles = {}
    for mid in range(1, 101):
        c = cast.get(mid, {}); s = stats.get(str(mid), {}); hd = holders.get(str(mid))
        m = {"n": s.get("name") or c.get("marble", f"Marble {mid}"),
             "st": [s.get("races", 0), s.get("wins", 0), s.get("podiums", 0), s.get("titles", 0)]}
        if c: m["r"] = {"p": c["piece"], "t": c["title"], "i": rel_asset(c["image"]), "b": c["borough"], "why": c.get("why", "")}
        if hd: m["h"] = {"n": hd["name"], "id": hd["id"], "s": rel_asset(hd["s"]), "l": rel_asset(hd["l"]), "t": hd["t"], "res": hd["res"]}
        marbles[mid] = m
    # titles from the champions list, which the ledger stats do not always carry
    titles = {}
    for h in champs["history"]: titles[h["champion"]["id"]] = titles.get(h["champion"]["id"], 0) + 1
    for mid, n in titles.items(): marbles[mid]["st"][3] = n

    for kind, size, key in (("riders", (200, 200), "r"), ("holders", (256, 144), "h")):
        at = Image.new("RGB", (size[0] * 10, size[1] * 10), (12, 12, 14))
        for mid in range(1, 101):
            m = marbles[mid].get(key)
            if not m: continue
            src = os.path.join(SITE, "assets", m["i"] if key == "r" else m["s"])
            if os.path.exists(src): at.paste(tile(src, size), (((mid - 1) % 10) * size[0], ((mid - 1) // 10) * size[1]))
        at.save(os.path.join(OUT, "atlas", f"{kind}.jpg"), quality=84, optimize=True)

    files = []
    for s in CARD_SESSIONS: files += sorted(glob.glob(os.path.expanduser(f"~/.codex/generated_images/{s}/*")), key=os.path.getmtime)
    os.makedirs(os.path.join(OUT, "cards"), exist_ok=True); cards = []
    for i, name in CARDS.items():
        im = Image.open(files[i]).convert("RGB"); im.thumbnail((1000, 900), Image.LANCZOS)
        f = f"cards/c{i}.jpg"; im.save(os.path.join(OUT, f), quality=84, optimize=True)
        series = 1 if i <= 29 else (2 if im.size[1] / im.size[0] > 1.8 else 3)
        cards.append({"f": f, "n": name, "s": series, "a": round(im.size[0] / im.size[1], 4)})

    # one atlas for the mobile in the void: 7 x 6 cells of 292 x 400, each card fitted whole on ink
    cw, ch = 292, 400; at = Image.new("RGB", (cw * 7, ch * 6), (13, 13, 13))
    for k, c in enumerate(cards):
        im = Image.open(os.path.join(OUT, c["f"])).convert("RGB"); im.thumbnail((cw, ch), Image.LANCZOS)
        at.paste(im, ((k % 7) * cw + (cw - im.size[0]) // 2, (k // 7) * ch + (ch - im.size[1]) // 2))
        c["fit"] = [round(im.size[0] / cw, 4), round(im.size[1] / ch, 4)]
    at.save(os.path.join(OUT, "atlas", "cards.jpg"), quality=84, optimize=True)

    film = os.path.join(OUT, "film", "skelly-cup.mp4")
    src = os.path.join(ROOT, "SKELLY CUP COMMERCIAL 2026-10-09", "SKELLY CUP 60s 16x9 X.mp4")
    if not os.path.exists(film) and os.path.exists(src):
        os.makedirs(os.path.dirname(film), exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", "scale=960:-2", "-c:v", "libx264", "-crf", "28",
                        "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", film], check=True)

    # Bryan's own marbles: the GLBs his viewer races, listed in marblerun.fun/marbles/manifest.json (IPFS). The page also
    # reads the live manifest; this copy is the fallback if his server is down.
    glb = {}
    try:
        import urllib.request
        req = urllib.request.Request("https://marblerun.fun/marbles/manifest.json", headers={"User-Agent": "skelly-spiral/0.1 (NEW YORKERS x Marble Run)"})
        man = json.load(urllib.request.urlopen(req, timeout=30))
        glb = {k: v["glb"] for k, v in man.items() if isinstance(v, dict) and v.get("glb")}
    except Exception as e:
        print("manifest not read:", e)
        old = os.path.join(OUT, "data.json")
        if os.path.exists(old): glb = J(old).get("glb", {})

    data = {"built": int(time.time() * 1000), "tours": tours, "marbles": marbles, "cards": cards, "glb": glb,
            "film": "film/skelly-cup.mp4" if os.path.exists(film) else None,
            "counts": {"tournaments": len(tours), "races": sum(1 for t in tours for r in t["races"] if r.get("w")),
                       "paintings": sum(1 for t in tours for r in t["races"] if r.get("art")),
                       "portraits": sum(1 for t in tours if t.get("portrait")), "riders": sum(1 for m in marbles.values() if m.get("r")),
                       "holders": sum(1 for m in marbles.values() if m.get("h")), "cards": len(cards)}}
    json.dump(data, open(os.path.join(OUT, "data.json"), "w"), separators=(",", ":"), ensure_ascii=False)
    print(json.dumps(data["counts"]))


if __name__ == "__main__":
    main()
