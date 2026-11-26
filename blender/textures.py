"""textures.py: the painted surfaces for the Cycles build of THE GARDEN, drawn with PIL at print resolution.
  python3 blender/textures.py
Writes blender/tex/: court (8192 x 3964 over the 62 x 30 m floor), the retired banners, the scoreboard faces, the ribbon."""
import os, random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'tex'); os.makedirs(OUT, exist_ok=True)
FONTS = os.path.join(ROOT, 'site', 'assets', 'fonts'); FF = os.path.join(ROOT, 'site', 'assets', 'ff'); ART = os.path.join(ROOT, 'site', 'assets', 'art')
PHT = os.path.join(ROOT, 'work', 'ph_tex')
def font(name, size): return ImageFont.truetype(os.path.join(FONTS, name), size)
ANTON, SKY, MONO = 'Anton-Regular.ttf', 'N3W-Skyline.otf', 'JetBrainsMono.ttf'
random.seed(7)

# ---------------- the court: 62 x 30 m, 132 px a metre
FW, FD, PX = 62, 30, 132
CW, CH = FW * PX, FD * PX
X = lambda x: (x + FW / 2) * PX
Z = lambda z: (z + FD / 2) * PX

def court():
    im = Image.new('RGB', (CW, CH), (20, 26, 48)); d = ImageDraw.Draw(im)
    # maple strips 5.7 cm wide (7.5 px), lengths 0.6 to 2.4 m, staggered, each its own honey
    bx0, bx1, bz0, bz1 = X(-17.4), X(17.4), Z(-10.2), Z(10.2)
    w = 0.057 * PX; z = bz0
    while z < bz1:
        x = bx0 - random.random() * 2 * PX
        while x < bx1:
            L = (0.6 + random.random() * 1.8) * PX; h = random.uniform(-1, 1)
            c = (int(222 + h * 14 + random.uniform(-6, 6)), int(176 + h * 14 + random.uniform(-6, 6)), int(122 + h * 12 + random.uniform(-8, 6)))
            if x + L > bx0: d.rectangle([max(x, bx0), z, min(x + L, bx1), z + w - 0.6], fill=c)
            d.line([max(x + L, bx0), z, max(x + L, bx0), z + w], fill=(150, 112, 70))   # the butt joint
            x += L
        d.line([bx0, z + w - 0.5, bx1, z + w - 0.5], fill=(168, 128, 84)); z += w
    # the grain: Poly Haven laminate (CC0) luminance, stretched along the boards, multiplied in
    g = Image.open(os.path.join(PHT, 'laminate_floor_02_c.jpg')).convert('L').resize((2048, 512))
    grain = Image.new('L', (CW, CH)); [grain.paste(g, (i, j)) for i in range(0, CW, 2048) for j in range(0, CH, 512)]
    grain = ImageOps.autocontrast(grain, cutoff=2).point(lambda v: int(200 + v * 0.22))
    im = ImageChops.multiply(im, Image.merge('RGB', [grain] * 3)); d = ImageDraw.Draw(im)
    L, W = 14.33, 7.62
    # the apron outside the lines, stained deep blue into the wood (the grain shows through)
    mask = Image.new('L', (CW, CH), 0); md = ImageDraw.Draw(mask); md.rectangle([bx0, bz0, bx1, bz1], fill=235); md.rectangle([X(-L), Z(-W), X(L), Z(W)], fill=0)
    blue = Image.new('RGB', (CW, CH), (16, 48, 118)); im = Image.composite(ImageChops.multiply(blue, Image.merge('RGB', [grain] * 3)).point(lambda v: min(255, int(v * 1.25))), im, mask)
    # the keys: home blue, an orange edge
    key = Image.new('L', (CW, CH), 0); kd = ImageDraw.Draw(key)
    for s in (-1, 1): kd.rectangle([X(-L) if s < 0 else X(L - 5.79), Z(-2.44), X(-L + 5.79) if s < 0 else X(L), Z(2.44)], fill=240)
    kb = Image.new('RGB', (CW, CH), (30, 70, 168)); im = Image.composite(ImageChops.multiply(kb, Image.merge('RGB', [grain] * 3)).point(lambda v: min(255, int(v * 1.2))), im, key)
    d = ImageDraw.Draw(im); line = (246, 243, 234); lw = int(0.05 * PX)
    orange = (245, 132, 38)
    def arc(cx, cz, r, a0, a1, col=line, wd=lw, dash=None):
        n = 200; pts = [(X(cx + r * math.cos(a0 + (a1 - a0) * i / n)), Z(cz + r * math.sin(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
        if dash: [d.line(pts[i:i + 2], fill=col, width=wd) for i in range(0, n, 1) if (i // dash) % 2 == 0]
        else: d.line(pts, fill=col, width=wd, joint='curve')
    for s in (-1, 1):
        kx0, kx1 = (X(-L), X(-L + 5.79)) if s < 0 else (X(L - 5.79), X(L))
        d.rectangle([kx0 + 0.13 * PX, Z(-2.44) + 0.13 * PX, kx1 - 0.13 * PX, Z(2.44) - 0.13 * PX], outline=orange, width=int(0.08 * PX))
        d.rectangle([kx0, Z(-2.44), kx1, Z(2.44)], outline=line, width=lw)
        rim, ft = s * (L - 1.575), s * (L - 5.79)
        arc(ft, 0, 1.83, math.pi / 2, math.pi * 1.5) if s > 0 else arc(ft, 0, 1.83, -math.pi / 2, math.pi / 2)
        arc(ft, 0, 1.83, -math.pi / 2, math.pi / 2, dash=6) if s > 0 else arc(ft, 0, 1.83, math.pi / 2, math.pi * 1.5, dash=6)
        arc(rim, 0, 1.22, math.pi / 2, math.pi * 1.5) if s > 0 else arc(rim, 0, 1.22, -math.pi / 2, math.pi / 2)
        a = math.asin(6.71 / 7.24)
        arc(rim, 0, 7.24, math.pi + a, math.pi - a + 2 * math.pi) if False else None
        if s > 0: arc(rim, 0, 7.24, math.pi - a, math.pi + a)
        else: arc(rim, 0, 7.24, -a, a)
        cx3 = rim - s * 7.24 * math.cos(a)
        for zz in (-6.71, 6.71): d.line([X(s * L), Z(zz), X(cx3), Z(zz)], fill=line, width=lw)
        for dd in (2.13, 3.05, 3.96, 4.88):
            for zz in (-2.44, 2.44): d.line([X(s * L - s * dd), Z(zz), X(s * L - s * dd), Z(zz + math.copysign(0.15, zz))], fill=line, width=lw)
        for zz in (-W, W): d.line([X(s * (L - 8.53)), Z(zz), X(s * (L - 8.53)), Z(zz + math.copysign(0.9, zz))], fill=line, width=lw)
    d.rectangle([X(-L), Z(-W), X(L), Z(W)], outline=line, width=lw); d.line([X(0), Z(-W), X(0), Z(W)], fill=line, width=lw)
    # centre circle: the Firefly centre art inside, orange ring
    cc = Image.open(os.path.join(FF, 'court_center.webp')).convert('RGB'); r = int(1.83 * PX); cc = cc.resize((2 * r, 2 * r))
    m = Image.new('L', (2 * r, 2 * r), 0); ImageDraw.Draw(m).ellipse([0, 0, 2 * r, 2 * r], fill=242); im.paste(cc, (int(X(0)) - r, int(Z(0)) - r), m)
    d = ImageDraw.Draw(im); arc(0, 0, 1.97, 0, 2 * math.pi, orange, int(0.14 * PX)); arc(0, 0, 1.83, 0, 2 * math.pi); arc(0, 0, 0.61, 0, 2 * math.pi)
    def word(t, x, z, size, col, rot=0, f=SKY):
        fn = font(f, int(size * PX)); bb = fn.getbbox(t); tw, th = bb[2] - bb[0], bb[3] - bb[1]
        lay = Image.new('L', (tw + 40, th + 40), 0); ImageDraw.Draw(lay).text((20 - bb[0], 20 - bb[1]), t, font=fn, fill=235)
        lay = lay.rotate(rot, expand=True); col_im = Image.new('RGB', lay.size, col)
        im.paste(col_im, (int(X(x) - lay.size[0] / 2), int(Z(z) - lay.size[1] / 2)), lay)
    word('THE GARDEN', -L - 1.3, 0, 1.15, line, -90); word('THE GARDEN', L + 1.3, 0, 1.15, line, 90)
    word('NEW YORK', 0, 8.8, 0.9, orange); word('NEW YORK', 0, -8.8, 0.9, orange, 180)
    word('N3W YORKERS', -7.4, 8.8, 0.5, line); word('BY MLOW', 7.4, 8.8, 0.5, line)
    im.save(os.path.join(OUT, 'court.jpg'), quality=92); print('court', im.size)

# ---------------- banners (512 x 1024 design, drawn at 1024 x 2048)
S = 2; BW, BH = 512 * S, 1024 * S
HOOPS = dict(field=(29, 66, 138), a=(245, 132, 38), b=(246, 243, 234), ink=(246, 243, 234))
ICE = dict(field=(0, 56, 168), a=(206, 17, 38), b=(246, 243, 234), ink=(246, 243, 234))
def jersey_path(cx, top, w, h):
    l, r = cx - w / 2, cx + w / 2; pts = []
    def q(p0, c, p1, n=16): return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]) for t in [i / n for i in range(n + 1)]]
    pts += q((l + w * .2, top), (cx, top + h * .17), (r - w * .2, top)); pts += [(r - w * .04, top)]
    pts += q((r - w * .04, top), (r - w * .06, top + h * .2), (r, top + h * .3)); pts += [(r, top + h), (l, top + h), (l, top + h * .3)]
    pts += q((l, top + h * .3), (l + w * .06, top + h * .2), (l + w * .04, top)); return pts
def centered(d, t, y, f, col, stroke=0, scol=None):
    bb = d.textbbox((0, 0), t, font=f, stroke_width=stroke); d.text((BW / 2 - (bb[2] - bb[0]) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), t, font=f, fill=col, stroke_width=stroke, stroke_fill=scol)
def retired(num, C):
    im = Image.new('RGB', (BW, BH), C['field']); d = ImageDraw.Draw(im)
    d.rectangle([18 * S, 18 * S, BW - 18 * S, BH - 18 * S], outline=C['b'], width=10 * S); d.rectangle([34 * S, 34 * S, BW - 34 * S, BH - 34 * S], outline=C['a'], width=6 * S)
    for i, col in enumerate([C['a'], C['b'], C['a']]): d.rectangle([34 * S, BH - (190 - i * 34) * S, BW - 34 * S, BH - (168 - i * 34) * S], fill=col)
    centered(d, 'NEW YORK', 104 * S, font(SKY, 58 * S), C['ink'])
    p = jersey_path(BW / 2, 170 * S, 330 * S, 470 * S); d.polygon(p, fill=C['b']); d.line(p + [p[0]], fill=C['a'], width=12 * S)
    big = 150 if len(num) > 2 else 250; centered(d, num, 420 * S, font(ANTON, big * S), C['field'], 7 * S, C['a'])
    centered(d, 'RETIRED', BH - 236 * S, font(MONO, 40 * S), C['ink']); return im
def title(year, C, word):
    im = Image.new('RGB', (BW, BH), C['field']); d = ImageDraw.Draw(im)
    d.rectangle([18 * S, 18 * S, BW - 18 * S, BH - 18 * S], outline=C['b'], width=10 * S); d.rectangle([18 * S, 150 * S, BW - 18 * S, 180 * S], fill=C['a']); d.rectangle([18 * S, BH - 300 * S, BW - 18 * S, BH - 270 * S], fill=C['a'])
    centered(d, 'NEW YORK', 96 * S, font(SKY, 62 * S), C['ink'])
    for i, w in enumerate(word.split(' ')): centered(d, w, (300 + i * 100) * S, font(SKY, 86 * S), C['ink'])
    centered(d, year, 600 * S, font(ANTON, 210 * S), C['b']); return im
def ours():
    im = Image.new('RGB', (BW, BH)); d = ImageDraw.Draw(im)
    for y in range(BH): t = y / BH; d.line([0, y, BW, y], fill=(int(13 + t * 28), int(26 + t * 72), int(90 + t * 165)))
    d.rectangle([18 * S, 18 * S, BW - 18 * S, BH - 18 * S], outline=(240, 244, 248), width=10 * S); d.rectangle([34 * S, 34 * S, BW - 34 * S, BH - 34 * S], outline=(255, 79, 163), width=6 * S)
    centered(d, 'N3W YORKERS', 110 * S, font(SKY, 74 * S), (240, 244, 248))
    logo = os.path.join(ROOT, 'site', 'assets', 'logo.png')
    if os.path.exists(logo): L_ = Image.open(logo).convert('RGBA'); L_.thumbnail((300 * S, 300 * S)); im.paste(L_, (int(BW / 2 - L_.size[0] / 2), int(330 * S - L_.size[1] / 2)), L_)
    centered(d, '1,111', 600 * S, font(ANTON, 150 * S), (240, 244, 248)); centered(d, 'OF 1,111', 690 * S, font(MONO, 44 * S), (240, 244, 248))
    d.rectangle([34 * S, BH - 230 * S, BW - 34 * S, BH - 204 * S], fill=(255, 79, 163)); centered(d, 'SOLD OUT', BH - 140 * S, font(SKY, 64 * S), (240, 244, 248)); centered(d, 'BY MLOW · 2026', BH - 82 * S, font(MONO, 30 * S), (240, 244, 248)); return im
def banners():
    names = []
    west = [title('1970', HOOPS, 'WORLD CHAMPIONS')] + [retired(n, HOOPS) for n in ['10', '12', '15', '15']] + [ours()] + [retired(n, HOOPS) for n in ['19', '22', '24', '33', '613']] + [title('1973', HOOPS, 'WORLD CHAMPIONS')]
    east = [title('1928', ICE, 'CHAMPIONS'), title('1933', ICE, 'CHAMPIONS')] + [retired(n, ICE) for n in ['1', '2', '3', '7', '9', '9', '11', '11', '19', '30', '35']] + [title('1940', ICE, 'CHAMPIONS'), title('1994', ICE, 'CHAMPIONS')]
    for side, lst in (('w', west), ('e', east)):
        for i, im in enumerate(lst): n = f'banner_{side}{i:02d}.jpg'; im.save(os.path.join(OUT, n), quality=90); names.append(n)
    print('banners', len(names))

# ---------------- the scoreboard: long faces show MLow's New Yorkers (a 3 x 1 strip), ends the score
def scoreboard():
    arts = sorted(os.listdir(ART)); random.shuffle(arts)
    for k in range(2):
        im = Image.new('RGB', (2400, 1200), (4, 5, 12)); d = ImageDraw.Draw(im)
        for i in range(3):
            a = Image.open(os.path.join(ART, arts[k * 3 + i])).convert('RGB'); a = ImageOps.fit(a, (780, 1000)); im.paste(a, (15 + i * 795, 30))
        d.rectangle([0, 1040, 2400, 1200], fill=(13, 26, 90)); centered_w(d, im.size[0], 'N3W YORKERS · BY MLOW · LIVE AT THE GARDEN', 1120, font(SKY, 96), (240, 244, 248))
        im.save(os.path.join(OUT, f'sb_long{k}.jpg'), quality=90)
    im = Image.new('RGB', (1600, 1200), (4, 5, 12)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 796, 180], fill=(29, 66, 138)); d.rectangle([804, 0, 1600, 180], fill=(163, 32, 43))
    centered_w(d, 800, 'NEW YORK', 92, font(SKY, 110), (246, 243, 234)); cx(d, 1200, 'VISITORS', 92, font(SKY, 110), (246, 243, 234))
    cx(d, 400, '98', 480, font(ANTON, 440), (245, 132, 38)); cx(d, 1200, '94', 480, font(ANTON, 440), (246, 243, 234))
    cx(d, 800, '2:31', 870, font(MONO, 200), (255, 210, 58)); cx(d, 250, 'QTR 4', 870, font(MONO, 80), (138, 147, 176)); cx(d, 1350, 'SHOT 14', 870, font(MONO, 80), (255, 42, 26))
    cx(d, 800, 'THE GARDEN · SEVENTH AVENUE', 1080, font(SKY, 90), (34, 211, 238)); im.save(os.path.join(OUT, 'sb_end.jpg'), quality=90)
def cx(d, x, t, y, f, col): bb = d.textbbox((0, 0), t, font=f); d.text((x - (bb[2] - bb[0]) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), t, font=f, fill=col)
def centered_w(d, w, t, y, f, col): cx(d, w / 2, t, y, f, col)

# ---------------- the ribbon: the Firefly fascia band with the house words between
def ribbon():
    f = Image.open(os.path.join(FF, 'fascia.webp')).convert('RGB'); f = ImageOps.fit(f, (4096, 256))
    d = ImageDraw.Draw(f);
    for i, t in enumerate(['N3W YORKERS', 'THE GARDEN', 'BY MLOW', 'NEW YORK']):
        d.rectangle([i * 1024 + 300, 40, i * 1024 + 760, 216], fill=(6, 8, 20)); cx(d, i * 1024 + 530, t, 128, font(SKY, 110), (240, 244, 248))
    f.save(os.path.join(OUT, 'ribbon.jpg'), quality=90)
    b = Image.new('RGB', (2048, 128), (240, 244, 248)); d = ImageDraw.Draw(b); d.rectangle([0, 108, 2048, 128], fill=(41, 98, 255))
    for i, t in enumerate(['N3W YORKERS', 'THE GARDEN', 'BY MLOW', 'OPEN EYE']): d.text((40 + i * 512, 18), t, font=font(SKY, 76), fill=(13, 13, 13) if i % 2 == 0 else (255, 79, 163))
    b.save(os.path.join(OUT, 'boards.jpg'), quality=90)

if __name__ == '__main__':
    court(); banners(); scoreboard(); ribbon()
