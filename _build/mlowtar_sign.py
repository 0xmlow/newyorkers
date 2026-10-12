#!/usr/bin/env python3
"""The letters on MLOWTAR's crown, as geometry.

A canvas texture stretched over the arch went soft and clipped (2026-10-12, first pass). Real signs have
raised letters, so this takes Fraunces (the site's display face, the variable font ON LOCATION ships) at
opsz 144 / wght 900, instances it with fontTools, flattens every glyph of the sign's words into polygons
and writes assets/mlowtar/sign.json. app.js builds a THREE.Shape (outer contour plus holes) per glyph and
extrudes it in brass, so the words are crisp from any distance and cast shadows on the plate.

  { "upm": 2000, "words": { "MLOW SPEAKS": [...], "FORTUNES": [...] }, "glyphs": { "M": { "adv": 1500, "contours": [[[x,y],...], ...] } } }
Contours are in font units, y up. Holes are resolved in the browser by containment.
"""
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.basePen import BasePen

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
FONT = os.path.join(ROOT, "ON LOCATION 2026-10-10", "site", "fonts", "Fraunces.ttf")
OUT = os.path.join(SITE, "assets", "mlowtar", "sign.json")
WORDS = ["MLOW SPEAKS", "FORTUNES", "THE CENSUS", "N3W YORKERS", "0123456789"]

class FlatPen(BasePen):
    """Flattens quadratic and cubic curves into short segments."""
    def __init__(self, glyphSet, steps=10):
        super().__init__(glyphSet); self.contours = []; self.cur = None; self.steps = steps
    def _moveTo(self, p): self.cur = [list(p)]
    def _lineTo(self, p): self.cur.append(list(p))
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]])
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append([u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]])
    def _closePath(self):
        if self.cur and len(self.cur) > 2:
            if self.cur[0] == self.cur[-1]: self.cur.pop()
            self.contours.append([[round(x, 1), round(y, 1)] for x, y in self.cur])
        self.cur = None
    def _endPath(self): self._closePath()

def main():
    if not os.path.exists(FONT):
        if os.path.exists(OUT): print("  mlowtar sign: Fraunces.ttf not on this Mac, the last sign.json stands"); return
        sys.exit("mlowtar sign: Fraunces.ttf missing and no sign.json yet")
    font = TTFont(FONT)
    font = instancer.instantiateVariableFont(font, {"opsz": 144, "wght": 900, "SOFT": 0, "WONK": 0})
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font["hmtx"]
    glyphs = {}
    for ch in sorted(set("".join(WORDS))):
        if ch == " ": glyphs[" "] = {"adv": hmtx[cmap[ord(" ")]][0] if ord(" ") in cmap else 500, "contours": []}; continue
        name = cmap.get(ord(ch))
        if not name: continue
        pen = FlatPen(gs); gs[name].draw(pen)
        glyphs[ch] = {"adv": hmtx[name][0], "contours": pen.contours}
    kern = {}
    data = {"upm": font["head"].unitsPerEm, "ascent": font["hhea"].ascent, "capHeight": getattr(font["OS/2"], "sCapHeight", 1400), "words": WORDS, "glyphs": glyphs}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(data, open(OUT, "w"), separators=(",", ":"))
    print(f"  mlowtar sign: {len(glyphs)} glyphs, {os.path.getsize(OUT) // 1024} KB")

if __name__ == "__main__": main()
