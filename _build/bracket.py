#!/usr/bin/env python3
"""bracket.py: a bracket graphic from a tournament JSON written by sim/garden_sim.py.

  python3 _build/bracket.py sim/out/tournament_3.json          # knockout  -> reels/tournament_3_bracket.png
  python3 _build/bracket.py sim/out/tournament_3_groups.json   # groups + semis + final
Broadcast palette: #101722 ground, #F2EFE8 type, #2962FF for the winner's path.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); FONTS = os.path.join(ROOT, "site", "assets", "fonts")
BG, INK, BLUE, DIM, CARD = "#101722", "#F2EFE8", "#2962FF", "#8C95A8", "#1A2333"
W, H = 1920, 1080

def font(name, size): return ImageFont.truetype(os.path.join(FONTS, name), size)

def main(path):
    T = json.load(open(path)); names, kits = T["names"], T["kits"]
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    anton, mono, sky, arch = (lambda s: font("Anton-Regular.ttf", s)), (lambda s: font("JetBrainsMono.ttf", s)), (lambda s: font("N3W-Skyline.otf", s)), (lambda s: font("Archivo.ttf", s))
    d.text((80, 58), "THE GARDEN", font=sky(40), fill=INK)
    title = "EIGHT TEAM KNOCKOUT" if T["format"] == "knockout" else "TWO GROUPS OF FOUR, SEMIS, FINAL"
    d.text((80, 112), title, font=anton(72), fill=INK)
    d.text((80, 200), f"SEED {T['seed']} · RULES {T['rules'].upper()} · EVERY GAME SIMULATED POSSESSION BY POSSESSION", font=mono(20), fill=DIM)
    champ = T["champion"]
    def card(x, y, w, g, stage):
        h = 112; won = g["winner"]
        d.rounded_rectangle((x, y, x + w, y + h), 14, fill=CARD)
        for k, (tid, sc) in enumerate(((g["home"], g["score"][0]), (g["away"], g["score"][1]))):
            yy = y + 14 + k * 46; win = tid == won
            j = kits[tid]["jersey"]; chip = kits[tid]["num"] if j.upper() in ("#0B0B0E",) else j
            d.rounded_rectangle((x + 16, yy + 4, x + 30, yy + 36), 3, fill=chip, outline=kits[tid]["trim"])
            d.text((x + 44, yy), names[tid], font=anton(30), fill=INK if win else DIM)
            s = str(sc); tw = d.textlength(s, font=anton(32))
            d.text((x + w - 22 - tw, yy - 1), s, font=anton(32), fill=INK if win else DIM)
            if win: d.rectangle((x, yy + 2, x + 5, yy + 38), fill=BLUE)
        if g.get("ot"): d.text((x + w - 70, y + h - 2), "OT", font=mono(16), fill=DIM)
        return (x, y + h / 2, x + w, y + h / 2)
    def link(a, b, c, hot):
        col = BLUE if hot else "#33405A"; mx = a[2] + 40
        for p in (a, b): d.line((p[2], p[3], mx, p[3]), fill=col, width=3)
        d.line((mx, a[3], mx, b[3]), fill=col, width=3); d.line((mx, (a[3] + b[3]) / 2, c[0], c[1]), fill=col, width=3)
    G = T["games"]
    if T["format"] == "knockout":
        qf, sf, fi = G[0:4], G[4:6], G[6]
        cw = 420; xs = [80, 620, 1160]
        q = [card(xs[0], 290 + i * 180, cw, g, "QF") for i, g in enumerate(qf)]
        s = [card(xs[1], 380 + i * 360, cw, g, "SF") for i, g in enumerate(sf)]
        f = card(xs[2], 560, cw, fi, "F")
        for i in range(2): link(q[2 * i], q[2 * i + 1], s[i], sf[i]["winner"] == champ or sf[i]["home"] == champ or sf[i]["away"] == champ)
        link(s[0], s[1], f, True)
        for x, lab in zip(xs, ("QUARTERFINALS", "SEMIFINALS", "FINAL")): d.text((x, 252), lab, font=mono(18), fill=DIM)
    else:
        x0 = 80
        for gi, gname in enumerate(("A", "B")):
            y0 = 270 + gi * 380
            d.text((x0, y0), f"GROUP {gname}", font=mono(18), fill=DIM)
            d.text((x0 + 330, y0), "W  L  PD*  PF", font=mono(18), fill=DIM)
            for k, r in enumerate(T["standings"][gname]):
                y = y0 + 34 + k * 70; adv = k < 2
                d.rounded_rectangle((x0, y, x0 + 560, y + 58), 12, fill=CARD)
                if adv: d.rectangle((x0, y + 8, x0 + 5, y + 50), fill=BLUE)
                tid = r["team"]; j = kits[tid]["jersey"]; chip = kits[tid]["num"] if j.upper() == "#0B0B0E" else j
                d.rounded_rectangle((x0 + 16, y + 13, x0 + 30, y + 45), 3, fill=chip, outline=kits[tid]["trim"])
                d.text((x0 + 44, y + 9), f"{r['rank']}  {names[tid]}", font=anton(30), fill=INK if adv else DIM)
                d.text((x0 + 330, y + 16), f"{r['w']}  {r['l']}  {r['pd_capped']:+d}  {r['pf']}", font=mono(22), fill=INK if adv else DIM)
        d.text((x0, 1020), "*POINT DIFFERENTIAL CAPPED AT 20 A GAME. TIE BREAKS: WINS, HEAD TO HEAD, CAPPED DIFFERENTIAL, POINTS, SEEDED DRAW", font=mono(15), fill=DIM)
        sf, fi = G[12:14], G[14]
        s = [card(760, 330 + i * 360, 440, g, "SF") for i, g in enumerate(sf)]
        f = card(1340, 510, 440, fi, "F"); link(s[0], s[1], f, True)
        d.text((760, 292), "SEMIFINALS", font=mono(18), fill=DIM); d.text((1340, 472), "FINAL", font=mono(18), fill=DIM)
    # the champion
    cx = 1160 if T["format"] == "knockout" else 1340
    d.text((cx, 720), "CHAMPION", font=mono(20), fill=BLUE)
    d.text((cx, 750), names[champ], font=anton(96), fill=INK)
    d.text((cx, 880), "N3W YORKERS", font=sky(30), fill=INK); d.text((cx, 938), "by MLow", font=arch(20), fill=DIM)
    out = os.path.join(ROOT, "reels", os.path.splitext(os.path.basename(path))[0] + "_bracket.png")
    os.makedirs(os.path.dirname(out), exist_ok=True); im.save(out); print(out)

if __name__ == "__main__":
    for p in sys.argv[1:] or ["sim/out/tournament_3.json"]: main(p if os.path.isabs(p) else os.path.join(ROOT, p))
