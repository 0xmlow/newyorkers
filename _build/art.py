"""art.py: deal twelve restyled New Yorkers to each of the twenty rooms.

The art is MLow's own census paintings as the Krea 3 style passes made them on 2026-10-14
(KREA3 ART STYLES 2026-10-14/census/<census>_<k>_<style>.jpg, about 220 per style). Each gallery takes 24 of its style:
room B first takes pieces painted in the neighbourhood it wraps, then both rooms fill from the rest, spread across the
census instead of the first numbers in a row. Copies are 1024 wide JPEGs in work/art (the sources are 2736 wide, 6 GB).

  python3 _build/art.py      # writes work/art/*.jpg and work/cast.json
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); DESK = os.path.dirname(ROOT)
SRC = os.path.join(DESK, "KREA3 ART STYLES 2026-10-14", "census")
OUT = os.path.join(ROOT, "work", "art")
# gallery: (style, hoods for room A, hoods for room B)
G = {
    "kusama": ("kusama", ["Financial District"], ["Chelsea"]),
    "basquiat": ("basquiat", ["SoHo", "Lower East Side"], ["NoHo", "East Village", "Greenwich Village"]),
    "haring": ("haring", ["Midtown", "Times Square"], ["Harlem", "East Harlem"]),
    "hokusai": ("hokusai", ["Upper East Side", "Central Park"], ["The Battery", "Financial District", "Battery Park City"]),
    "lichtenstein": ("lichtenstein", ["Upper East Side"], ["Midtown", "Hell's Kitchen"]),
    "dali": ("dali", ["Midtown"], ["Flushing", "Corona", "Flushing Meadows"]),
    "warhol": ("warhol", ["Turtle Bay", "Murray Hill"], ["Midtown", "Koreatown", "Herald Square"]),
    "vangogh": ("vangogh", ["Midtown"], ["DUMBO", "Brooklyn Heights"]),
    "picasso": ("picasso", ["Midtown East", "Midtown"], ["Midtown"]),
    "banksy": ("banksy", ["Central Park", "Upper West Side"], ["Meatpacking District", "West Village", "Chelsea"]),
}
N = 12
NC = 28   # room C, THE SHOW: the hall that exists to hang them
VW, VH, VC = 160, 90, 16   # the vault: every piece of a style as one atlas, VC cells across

VOUT = os.path.join(ROOT, "work", "vault")
def vault(style, pool, P):
    """every piece in the style: 448 wide copies for the card, and one atlas for the wall"""
    os.makedirs(os.path.join(VOUT, style), exist_ok=True)
    items = [(c, f) for c, f in pool if c in P]
    rows = (len(items) + VC - 1) // VC
    at = Image.new("RGB", (VC * VW, rows * VH), (12, 12, 12)); lst = []
    for k, (c, f) in enumerate(items):
        dst = os.path.join(VOUT, style, f)
        if not os.path.exists(dst):
            im = Image.open(os.path.join(SRC, f)).convert("RGB"); im.thumbnail((448, 448)); im.save(dst, quality=72, optimize=True, progressive=True)
        im = Image.open(dst).resize((VW, VH), Image.LANCZOS); at.paste(im, ((k % VC) * VW, (k // VC) * VH))
        p = P[c]; lst.append([c, p["title"], p.get("neighborhood", ""), f, p.get("image", "")])
    at.save(os.path.join(VOUT, f"atlas_{style}.jpg"), quality=80, optimize=True)
    json.dump({"cols": VC, "rows": rows, "items": lst}, open(os.path.join(VOUT, f"{style}.json"), "w"), ensure_ascii=False)

def main():
    P = {p["n"]: p for p in json.load(open(os.path.join(DESK, "NEW YORKERS SITE", "api", "pieces.json")))}
    files = {}
    for f in os.listdir(SRC):
        if not f.endswith(".jpg"): continue
        c, _, s = f[:-4].split("_"); files.setdefault(s, []).append((int(c), f))
    os.makedirs(OUT, exist_ok=True); cast = {}
    for gid, (style, ha, hb) in G.items():
        pool = sorted(files[style]); used = set()
        def take(hoods, n):
            out = [c for c, f in pool if c not in used and P.get(c, {}).get("neighborhood") in hoods][:n]
            used.update(out); return out
        b = take(hb, N); a = take(ha, N)
        rest = [c for c, f in pool if c not in used and c in P]
        step = max(1, len(rest) // (2 * N + 2))
        spread = rest[::step]
        for lst in (a, b):
            while len(lst) < N and spread:
                c = spread.pop(0)
                if c not in used: used.add(c); lst.append(c)
        cc = []
        rest2 = [c for c, f in pool if c not in used and c in P]
        step2 = max(1, len(rest2) // NC)
        for c in rest2[::step2][:NC]: used.add(c); cc.append(c)
        for room, lst in (("a", a), ("b", b), ("c", cc)):
            pick = []
            for c in lst:
                f = dict(pool)[c]; dst = os.path.join(OUT, f)
                if not os.path.exists(dst):
                    im = Image.open(os.path.join(SRC, f)).convert("RGB"); im.thumbnail((1024, 1024)); im.save(dst, quality=80)
                p = P[c]; pick.append({"n": c, "t": p["title"], "h": p.get("neighborhood", ""), "b": p.get("borough", ""), "f": f, "s": (p.get("story") or "")[:160], "i": p.get("image", "")})
            cast[f"{gid}_{room}"] = pick
        vault(style, pool, P)
        print(gid, len(a), len(b), len(cc))
    json.dump(cast, open(os.path.join(ROOT, "work", "cast.json"), "w"), ensure_ascii=False, indent=0)

if __name__ == "__main__":
    main()
