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
    d = ImageDraw.Draw(im); arc(0, 0, 1.83, 0, 2 * math.pi); arc(0, 0, 0.61, 0, 2 * math.pi)
    def word(t, x, z, size, col, rot=0, f=SKY):
        fn = font(f, int(size * PX)); bb = fn.getbbox(t); tw, th = bb[2] - bb[0], bb[3] - bb[1]
        lay = Image.new('L', (tw + 40, th + 40), 0); ImageDraw.Draw(lay).text((20 - bb[0], 20 - bb[1]), t, font=fn, fill=235)
        lay = lay.rotate(rot, expand=True); col_im = Image.new('RGB', lay.size, col)
        im.paste(col_im, (int(X(x) - lay.size[0] / 2), int(Z(z) - lay.size[1] / 2)), lay)
    # the N3W YORKERS stacked skyline logo, MLow's pick: huge over centre court, white in both keys and all round the apron
    LB, LW = Image.open(os.path.join(OUT, 'logo_black.png')), Image.open(os.path.join(OUT, 'logo_white.png'))
    def logo(L_, x, z, size, rot=0, alpha=1.0):
        g = L_.resize((int(size * PX), int(size * PX)), Image.LANCZOS).rotate(rot, expand=True)
        if alpha < 1: g.putalpha(g.getchannel('A').point(lambda v: int(v * alpha)))
        im.paste(g, (int(X(x) - g.size[0] / 2), int(Z(z) - g.size[1] / 2)), g)
    logo(LB, 0, 0, 7.4, 0, 0.93)
    for sx in (-1, 1): logo(LW, sx * (L - 2.9), 0, 3.6, -90 * sx, 0.9)
    for xx in (-12, -6, 6, 12):
        logo(LW, xx, 8.9, 1.6, 0); logo(LW, xx, -8.9, 1.6, 180)
    for sx in (-1, 1):
        for zz in (-5.6, 5.6): logo(LW, sx * (L + 1.5), zz, 1.9, -90 * sx)
    word('THE GARDEN', -L - 1.3, 0, 1.1, line, -90); word('THE GARDEN', L + 1.3, 0, 1.1, line, 90)
    word('NEW YORK', 0, 8.8, 0.9, orange); word('NEW YORK', 0, -8.8, 0.9, orange, 180)
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
def artgrid(w, h, n, seed, logo_every=0, pad=12):
    """a strip of MLow's New Yorkers, n across, with the stacked logo every logo_every panels on deep blue"""
    arts = sorted(os.listdir(ART)); rnd = random.Random(seed); rnd.shuffle(arts)
    im = Image.new('RGB', (w, h), (4, 6, 18)); pw = (w - pad) // n; LW_ = Image.open(os.path.join(OUT, 'logo_white.png'))
    k = 0
    for i in range(n):
        x0 = pad + i * pw
        if logo_every and i % logo_every == logo_every // 2:
            tile = Image.new('RGB', (pw - pad, h - 2 * pad), (13, 26, 90)); g = LW_.copy(); g.thumbnail((pw - pad - 40, h - 2 * pad - 40)); tile.paste(g, ((tile.size[0] - g.size[0]) // 2, (tile.size[1] - g.size[1]) // 2), g)
        else:
            tile = ImageOps.fit(Image.open(os.path.join(ART, arts[k % len(arts)])).convert('RGB'), (pw - pad, h - 2 * pad)); k += 1
        im.paste(tile, (x0, pad))
    return im
def scoreboard():
    # the long faces of the centre hung board: three New Yorkers and the logo, 24 x 11 m
    for k in range(2): artgrid(2640, 1210, 4, 40 + k, logo_every=4).save(os.path.join(OUT, f'sb_long{k}.jpg'), quality=90)
    # the ends: the score beside the logo, 16 x 11 m
    im = Image.new('RGB', (1760, 1210), (4, 5, 12)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 876, 190], fill=(29, 66, 138)); d.rectangle([884, 0, 1760, 190], fill=(163, 32, 43))
    cx(d, 438, 'NEW YORK', 98, font(SKY, 118), (246, 243, 234)); cx(d, 1322, 'VISITORS', 98, font(SKY, 118), (246, 243, 234))
    cx(d, 438, '98', 470, font(ANTON, 430), (245, 132, 38)); cx(d, 1322, '94', 470, font(ANTON, 430), (246, 243, 234))
    cx(d, 880, '2:31', 820, font(MONO, 200), (255, 210, 58)); cx(d, 260, 'QTR 4', 820, font(MONO, 80), (138, 147, 176)); cx(d, 1500, 'SHOT 14', 820, font(MONO, 80), (255, 42, 26))
    g = Image.open(os.path.join(OUT, 'logo_white.png')); g.thumbnail((300, 300)); im.paste(g, (730, 900), g)
    cx(d, 380, 'N3W YORKERS', 1050, font(SKY, 90), (240, 244, 248)); cx(d, 1380, 'BY MLOW', 1050, font(SKY, 90), (240, 244, 248))
    im.save(os.path.join(OUT, 'sb_end.jpg'), quality=90)
    # the belly: the round screen under the board, the logo looking down at the court
    im = Image.new('RGB', (2048, 2048), (16, 20, 28)); g = Image.open(os.path.join(OUT, 'logo_white.png')).resize((1100, 1100)); im.paste(g, (474, 474), g); im.save(os.path.join(OUT, 'sb_belly.jpg'), quality=90)
    # the big wall screens: two long ones over the sides, two curved over the ends
    artgrid(4800, 1200, 5, 7, logo_every=5).save(os.path.join(OUT, 'wall_side0.jpg'), quality=90)
    artgrid(4800, 1200, 5, 8, logo_every=5).save(os.path.join(OUT, 'wall_side1.jpg'), quality=90)
    artgrid(8192, 1024, 9, 9, logo_every=3).save(os.path.join(OUT, 'wall_end.jpg'), quality=90)
def cx(d, x, t, y, f, col): bb = d.textbbox((0, 0), t, font=f); d.text((x - (bb[2] - bb[0]) / 2 - bb[0], y - (bb[3] - bb[1]) / 2 - bb[1]), t, font=f, fill=col)
def centered_w(d, w, t, y, f, col): cx(d, w / 2, t, y, f, col)

# ---------------- the ribbon: the Firefly fascia band with the house words between
def ribbon():
    """the LED ribbon round the bowl: the Firefly fascia, the white logo and the house words, in turns"""
    f = Image.open(os.path.join(FF, 'fascia.webp')).convert('RGB'); f = ImageOps.fit(f, (4096, 256)); d = ImageDraw.Draw(f)
    g = Image.open(os.path.join(OUT, 'logo_white.png')); g.thumbnail((236, 236))
    for i, t in enumerate(['N3W YORKERS', 'BY MLOW', 'THE GARDEN', 'NEW YORK']):
        d.rectangle([i * 1024 + 150, 0, i * 1024 + 900, 256], fill=(13, 26, 90)); f.paste(g, (i * 1024 + 170, 10), g); cx(d, i * 1024 + 620, t, 128, font(SKY, 104), (240, 244, 248))
    f.save(os.path.join(OUT, 'ribbon.jpg'), quality=90)
    b = Image.new('RGB', (2048, 128), (13, 26, 90)); d = ImageDraw.Draw(b); g = Image.open(os.path.join(OUT, 'logo_white.png')); g.thumbnail((120, 120))
    for i, t in enumerate(['N3W YORKERS', 'BY MLOW', 'N3W YORKERS', 'OPEN EYE']):
        b.paste(g, (i * 512 + 10, 4), g); d.text((i * 512 + 140, 22), t, font=font(SKY, 70), fill=(240, 244, 248) if i % 2 == 0 else (255, 79, 163))
    b.save(os.path.join(OUT, 'boards.jpg'), quality=90)
    # the stanchion pad decal
    p = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); g = Image.open(os.path.join(OUT, 'logo_white.png')).resize((1024, 1024)); p.alpha_composite(g); p.save(os.path.join(OUT, 'pad_logo.png'))

# ---------------- jerseys: one 1024 x 512 sheet per player, front on the left half, back on the right (mirrored in u by the shader)
KITS = {'home': dict(word='N3W YORKERS', letter=(23, 59, 153), edge=(41, 98, 255), nums=['3', '5', '11', '23', '30', '8', '13', '1', '20', '44', '6', '15']),
        'away': dict(word='NIGHT SHIFT', letter=(240, 237, 229), edge=(41, 98, 255), nums=['0', '7', '12', '21', '34', '2', '9', '17', '24', '33', '4', '10'])}
def jerseys():
    for team, K in KITS.items():
        for i, n in enumerate(K['nums']):
            im = Image.new('RGBA', (1024, 512), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
            def put(t, cxp, cyp, size, f, stroke):
                fn = font(f, size); bb = d.textbbox((0, 0), t, font=fn, stroke_width=stroke); d.text((cxp - (bb[2] - bb[0]) / 2 - bb[0], cyp - (bb[3] - bb[1]) / 2 - bb[1]), t, font=fn, fill=K['letter'] + (255,), stroke_width=stroke, stroke_fill=K['edge'] + (255,))
            # front: the wordmark across the chest, the number under it (v = (z - 0.80) / 0.70 from the floor of the rest pose)
            put(K['word'], 256, 512 - 0.74 * 512, 54, ANTON, 4); put(n, 256, 512 - 0.53 * 512, 120, ANTON, 7)
            # back: a small N3W over a big number
            put('N3W' if team == 'home' else 'NIGHT', 768, 512 - 0.83 * 512, 36, ANTON, 3); put(n, 768, 512 - 0.58 * 512, 178, ANTON, 8)
            im.save(os.path.join(OUT, f'jersey_{team}_{i}.png'))
    print('jerseys', sum(len(K['nums']) for K in KITS.values()))

# ---------------- round 3 (Astra CG tells): three ribbon sheets of ten distinct layouts each, drawn at the ribbon's own aspect
# (8192 x 256 is 25.6 m x 0.8 m), picked per 25.6 m tile by the shader so the band never repeats in sight
def ribbon3():
    rnd = random.Random(3); arts = sorted(os.listdir(ART)); W, H, n = 8192, 256, 10; cw = W // n
    logo = Image.open(os.path.join(OUT, 'logo_white.png')); fas = Image.open(os.path.join(FF, 'fascia.webp')).convert('RGB')
    BLUE, NAVY, INK, PINK, ORNG, CLOUD = (41, 98, 255), (13, 26, 90), (10, 12, 18), (255, 79, 163), (245, 132, 38), (240, 244, 248)
    def lay(kind, k):
        c = Image.new('RGB', (cw, H), NAVY); d = ImageDraw.Draw(c)
        if kind == 'score':
            c.paste(INK, (0, 0, cw, H)); cx(d, 150, 'N3W', 70, font(SKY, 72), CLOUD); cx(d, 150, str(96 + k % 5), 175, font(ANTON, 120), ORNG)
            cx(d, 410, 'NIGHT', 70, font(SKY, 72), CLOUD); cx(d, 410, str(92 + k % 4), 175, font(ANTON, 120), CLOUD)
            cx(d, 670, 'Q4', 70, font(MONO, 60), (150, 160, 180)); cx(d, 670, f'{2 - k % 2}:{31 - 7 * (k % 3):02d}', 175, font(MONO, 96), CLOUD)
        elif kind == 'art':
            a = Image.open(os.path.join(ART, arts[(k * 7) % len(arts)])).convert('RGB'); a = ImageOps.fit(a, (cw, H), centering=(0.5, rnd.uniform(0.2, 0.8))); c.paste(a)
        elif kind == 'fascia':
            x0 = (k * 1311) % max(1, fas.width - cw * fas.height // H); f = fas.crop((x0, 0, x0 + cw * fas.height // H, fas.height)).resize((cw, H)); c.paste(f)
        elif kind == 'word':
            c.paste(BLUE, (0, 0, cw, H)); g = logo.copy(); g.thumbnail((220, 220)); c.paste(g, (20, 18), g); cx(d, 520, 'N3W YORKERS', 128, font(SKY, 92), CLOUD)
        elif kind == 'noise':
            c.paste(INK, (0, 0, cw, H)); cx(d, cw // 2, ['MAKE SOME NOISE', 'DE-FENSE', 'LOUDER', 'ON YOUR FEET'][k % 4], 128, font(ANTON, 150), [CLOUD, ORNG, PINK, CLOUD][k % 4])
        elif kind == 'player':
            c.paste((18, 22, 34), (0, 0, cw, H)); num = ['3', '0', '11', '7', '23'][k % 5]; cx(d, 120, num, 128, font(ANTON, 200), BLUE)
            cx(d, 480, ['N3W YORKERS', 'NIGHT SHIFT'][k % 2], 80, font(SKY, 64), CLOUD); cx(d, 480, f'{18 + k % 9} PTS  {4 + k % 5} REB  {2 + k % 6} AST', 180, font(MONO, 50), (170, 180, 200))
        elif kind == 'quiet':
            c.paste((9, 14, 40), (0, 0, cw, H)); g = logo.copy(); g.thumbnail((120, 120)); c.paste(g, (cw // 2 - 60, 68), g)
        elif kind == 'calm':
            c.paste((10, 18, 58), (0, 0, cw, H)); d.rectangle([0, H - 10, cw, H - 4], fill=(41, 98, 255))
        elif kind == 'house':
            c.paste(NAVY, (0, 0, cw, H)); cx(d, cw // 2, ['THE GARDEN', 'NEW YORK', 'BY MLOW', 'OPEN EYE'][k % 4], 128, font(SKY, 110), [CLOUD, CLOUD, PINK, BLUE][k % 4])
        return c
    kinds = ['score', 'quiet', 'art', 'noise', 'calm', 'fascia', 'player', 'word', 'art', 'calm']
    for sh, tag in enumerate('abc'):
        im = Image.new('RGB', (W, H)); ks = kinds[sh * 3:] + kinds[:sh * 3]
        for i, kd in enumerate(ks): im.paste(lay(kd, sh * 10 + i), (i * cw, 0))
        im.save(os.path.join(OUT, f'ribbon_{tag}.jpg'), quality=90)
    print('ribbon3 sheets')

# ---------------- round 3: play wear on the court, in the court image's own UV (62 x 30 m), white = worn
def court_wear():
    W, H = 4096, 1982; ppm = W / 62.0; im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im); rnd = random.Random(21)
    def P(x, y): return (W / 2 + x * ppm, H / 2 - y * ppm)
    def zone():
        r = rnd.random()
        if r < 0.55: s = rnd.choice((-1, 1)); return s * rnd.uniform(8.6, 14.2), rnd.gauss(0, 1.6)         # the paint and the block
        if r < 0.75: s = rnd.choice((-1, 1)); a = rnd.uniform(-1.3, 1.3); return s * (12.75 - 7.24 * math.cos(a)), 7.24 * math.sin(a)   # the arc
        if r < 0.88: s = rnd.choice((-1, 1)); return s * rnd.uniform(13.5, 14.3), rnd.uniform(-7, 7)    # the baseline
        return rnd.uniform(-12, 12), rnd.uniform(-7, 7)
    for k in range(220):
        x, y = zone(); L_ = rnd.uniform(0.05, 0.25); w_ = rnd.uniform(0.005, 0.025); a = rnd.uniform(0, math.pi)
        x1, y1 = x + L_ * math.cos(a), y + L_ * math.sin(a); d.line([P(x, y), P(x1, y1)], fill=rnd.randint(90, 200), width=max(1, int(w_ * ppm)))
    for k in range(900):   # the faint haze of traffic in the lanes
        x, y = zone(); r = rnd.uniform(0.1, 0.5) * ppm; cxp, cyp = P(x, y); d.ellipse([cxp - r, cyp - r * 0.6, cxp + r, cyp + r * 0.6], fill=rnd.randint(10, 30))
    im = im.filter(ImageFilter.GaussianBlur(1.2)); im.save(os.path.join(OUT, 'court_wear.png')); print('court wear')

# ---------------- the other floors (2026-11-27): ice, the concert floor, the fight floor and canvas, the circus, all at
# 66 px a metre over the same 62 x 30 m rectangle as the court, so the walk and Cycles use one image per setup
FPX = 66; FW_, FH_ = 62 * FPX, 30 * FPX
def FX(x): return (x + 31) * FPX
def FZ(y): return (15 - y) * FPX      # image top is plan +y, as the court
def _noise(w, h, scale, seed):
    r = random.Random(seed); sm = Image.new('L', (max(1, w // scale), max(1, h // scale))); sm.putdata([r.randint(0, 255) for _ in range(sm.width * sm.height)])
    return sm.resize((w, h), Image.BICUBIC)
def _logo(kind, size):
    g = Image.open(os.path.join(OUT, f'logo_{kind}.png')).convert('RGBA'); g.thumbnail((size, size)); return g
def _rink_mask(H=30.5, W=13.0, R=8.5, inset=0.0):
    m = Image.new('L', (FW_, FH_), 0); d = ImageDraw.Draw(m); H -= inset; W -= inset; R -= inset
    d.rounded_rectangle([FX(-H), FZ(W), FX(H), FZ(-W)], radius=int(R * FPX), fill=255); return m
def ice():
    rnd = random.Random(7); H, W = 30.5, 13.0
    base = Image.new('RGB', (FW_, FH_), (18, 20, 26))
    ice_ = Image.merge('RGB', [_noise(FW_, FH_, 40, 1).point(lambda v: 226 + v // 24), _noise(FW_, FH_, 40, 1).point(lambda v: 234 + v // 28), _noise(FW_, FH_, 40, 1).point(lambda v: 242 + v // 40)])
    d = ImageDraw.Draw(ice_)
    # skate marks: long shallow arcs, greyer, densest in the slot and along the boards
    for k in range(5200):
        zone = rnd.random()
        if zone < 0.35: x, y = rnd.choice((-1, 1)) * rnd.uniform(18, 27), rnd.gauss(0, 4)
        elif zone < 0.55: x, y = rnd.uniform(-29, 29), rnd.choice((-1, 1)) * rnd.uniform(9.5, 12.6)
        else: x, y = rnd.uniform(-29, 29), rnd.uniform(-12, 12)
        a = rnd.uniform(0, math.tau); L = rnd.uniform(0.4, 3.2); bend = rnd.uniform(-0.6, 0.6); pts = []
        for i in range(9):
            t = i / 8; aa = a + bend * t; pts.append((FX(x + math.cos(aa) * L * t), FZ(y + math.sin(aa) * L * t)))
        c = rnd.randint(196, 222); d.line(pts, fill=(c, c + 6, c + 12), width=rnd.choice((1, 1, 2)))
    # snow along the boards and in the corners
    snow = ImageChops.subtract(_rink_mask(), _rink_mask(inset=0.9)).filter(ImageFilter.GaussianBlur(26))
    ice_ = Image.composite(Image.new('RGB', (FW_, FH_), (247, 249, 252)), ice_, snow.point(lambda v: int(v * 0.8)))
    d = ImageDraw.Draw(ice_); RED, BLU, CRE = (196, 28, 48), (30, 86, 214), (120, 170, 235)
    lw = int(0.3 * FPX); gl = int(0.05 * FPX)
    # centre ice: the logo under the ice, a little milky
    g = _logo('black', int(6.4 * FPX)); g.putalpha(g.getchannel('A').point(lambda v: int(v * 0.82))); ice_.paste(g, (int(FX(0) - g.width / 2), int(FZ(0) - g.height / 2)), g)
    d.rectangle([FX(-0.15), FZ(W), FX(0.15), FZ(-W)], fill=RED)
    for s in (-1, 1):
        d.rectangle([FX(s * 4.27 - 0.15), FZ(W), FX(s * 4.27 + 0.15), FZ(-W)], fill=BLU)
        gx = s * 27.13; d.rectangle([FX(gx) - gl / 2, FZ(W - 1.3), FX(gx) + gl / 2, FZ(-W + 1.3)], fill=RED)
        # the crease and the trapezoid
        d.pieslice([FX(gx - 1.83), FZ(1.83), FX(gx + 1.83), FZ(-1.83)], 90 if s > 0 else -90, 270 if s > 0 else 90, fill=CRE, outline=RED, width=gl)
        for sy in (-1, 1): d.line([FX(gx), FZ(sy * 3.35), FX(s * 30.45), FZ(sy * 4.27)], fill=RED, width=gl)
        for yc in (-6.71, 6.71):
            cx_ = s * 21.03; d.ellipse([FX(cx_ - 4.57), FZ(yc + 4.57), FX(cx_ + 4.57), FZ(yc - 4.57)], outline=RED, width=gl)
            d.ellipse([FX(cx_ - 0.3), FZ(yc + 0.3), FX(cx_ + 0.3), FZ(yc - 0.3)], fill=RED)
            for hx in (-0.9, 0.9):
                for hy in (-1, 1): d.line([FX(cx_ + hx), FZ(yc + hy * 4.57), FX(cx_ + hx), FZ(yc + hy * 5.18)], fill=RED, width=gl)
            nx = s * 5.79; d.ellipse([FX(nx - 0.3), FZ(yc + 0.3), FX(nx + 0.3), FZ(yc - 0.3)], fill=RED)
        # the house words in the neutral zone, faint under the ice
        t = Image.new('RGBA', (int(9 * FPX), int(2 * FPX)), (0, 0, 0, 0)); td = ImageDraw.Draw(t)
        f = font(SKY, int(1.3 * FPX)); bb = td.textbbox((0, 0), 'N3W YORKERS', font=f); td.text(((t.width - bb[2]) / 2, (t.height - bb[3]) / 2 - bb[1] / 2), 'N3W YORKERS', font=f, fill=(30, 86, 214, 120))
        t = t.rotate(90 * s, expand=True); ice_.paste(t, (int(FX(s * 12.5) - t.width / 2), int(FZ(0) - t.height / 2)), t)
    d.ellipse([FX(-4.57), FZ(4.57), FX(4.57), FZ(-4.57)], outline=BLU, width=gl); d.ellipse([FX(-0.15), FZ(0.15), FX(0.15), FZ(-0.15)], fill=BLU)
    out = Image.composite(ice_, base, _rink_mask()); out.save(os.path.join(OUT, 'ice_full.jpg'), quality=90); print('ice')
def stage_floor():
    rnd = random.Random(8); im = Image.merge('RGB', [_noise(FW_, FH_, 6, 3).point(lambda v: 14 + v // 20)] * 3); d = ImageDraw.Draw(im)
    # the GA floor: black protection tiles a metre square, worn grey at the edges, gaffer tape and cable ramps
    for gx in range(-31, 31):
        for gy in range(-15, 15):
            c = rnd.randint(16, 26); d.rectangle([FX(gx) + 2, FZ(gy + 1) + 2, FX(gx + 1) - 2, FZ(gy) - 2], fill=(c, c, c + 2))
            d.line([FX(gx), FZ(gy), FX(gx + 1), FZ(gy)], fill=(40, 40, 44), width=2); d.line([FX(gx), FZ(gy), FX(gx), FZ(gy + 1)], fill=(40, 40, 44), width=2)
    for k in range(60):
        x, y = rnd.uniform(-14, 26), rnd.uniform(-12, 12); a = rnd.choice((0, math.pi / 2)) + rnd.uniform(-0.1, 0.1); L = rnd.uniform(0.3, 1.2)
        d.line([FX(x), FZ(y), FX(x + math.cos(a) * L), FZ(y + math.sin(a) * L)], fill=rnd.choice([(220, 222, 226), (41, 98, 255), (240, 200, 40)]), width=int(0.048 * FPX))
    for y in (-6.0, 6.5):
        d.rectangle([FX(-16), FZ(y + 0.25), FX(10), FZ(y - 0.25)], fill=(34, 34, 30))
        for x in range(-16, 10): d.line([FX(x), FZ(y + 0.25), FX(x), FZ(y - 0.25)], fill=(220, 190, 30), width=3)
    im.save(os.path.join(OUT, 'stage_full.jpg'), quality=90); print('stage floor')
def ring_floor():
    rnd = random.Random(9); im = Image.merge('RGB', [_noise(FW_, FH_, 3, 4).point(lambda v: 12 + v // 28), _noise(FW_, FH_, 3, 4).point(lambda v: 13 + v // 28), _noise(FW_, FH_, 3, 4).point(lambda v: 18 + v // 26)])
    d = ImageDraw.Draw(im)
    # blue carpet aisles from both tunnels to the ring, the logo at the foot of each
    for s in (-1, 1):
        d.rectangle([FX(s * 4.6) if s > 0 else FX(-30), FZ(1.1), FX(30) if s > 0 else FX(-4.6), FZ(-1.1)], fill=(18, 42, 120))
        g = _logo('white', int(1.8 * FPX)); im.paste(g, (int(FX(s * 7.2) - g.width / 2), int(FZ(0) - g.height / 2)), g)
    for r in range(1, 12):   # row tape round the ring
        for s in (-1, 1): d.line([FX(-4.6 - r * 1.1), FZ(s * (4.6 + r * 0.95)), FX(4.6 + r * 1.1), FZ(s * (4.6 + r * 0.95))], fill=(60, 62, 70), width=2)
    im.save(os.path.join(OUT, 'ring_full.jpg'), quality=90)
    # the canvas: 7.3 m square (20 ft inside the ropes plus the apron), light, the stacked logo, the corners
    C = 2048; c = Image.merge('RGB', [_noise(C, C, 2, 5).point(lambda v: 226 + v // 20), _noise(C, C, 2, 5).point(lambda v: 230 + v // 20), _noise(C, C, 2, 5).point(lambda v: 238 + v // 24)])
    cd = ImageDraw.Draw(c); ppm = C / 7.3
    for k in range(140):   # scuffs and old marks, faint
        x, y = rnd.uniform(0.8, 6.5) * ppm, rnd.uniform(0.8, 6.5) * ppm; r = rnd.uniform(0.02, 0.08) * ppm; v_ = rnd.randint(214, 224); cd.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=(v_, v_ + 2, v_ + 6))
    c = c.filter(ImageFilter.GaussianBlur(1.5)); cd = ImageDraw.Draw(c)
    g = _logo('black', int(3.6 * ppm)); c.paste(g, (C // 2 - g.width // 2, C // 2 - g.height // 2), g)
    ap = int(0.6 * ppm); cd.rectangle([0, 0, C, ap], fill=(20, 40, 110)); cd.rectangle([0, C - ap, C, C], fill=(20, 40, 110)); cd.rectangle([0, 0, ap, C], fill=(20, 40, 110)); cd.rectangle([C - ap, 0, C, C], fill=(20, 40, 110))
    f = font(SKY, int(0.38 * ppm))
    for i, t in enumerate(['N3W YORKERS', 'BY MLOW', 'N3W YORKERS', 'THE GARDEN']):
        tt = Image.new('RGBA', (C, ap), (0, 0, 0, 0)); td = ImageDraw.Draw(tt); bb = td.textbbox((0, 0), t, font=f); td.text(((C - bb[2]) / 2, (ap - bb[3]) / 2 - bb[1] / 2), t, font=f, fill=(240, 244, 248, 255))
        tt = tt.rotate(90 * i, expand=True); pos = [(0, C - ap), (C - ap, 0), (0, 0), (0, 0)][i]; c.paste(tt, pos, tt)
    c.save(os.path.join(OUT, 'canvas.jpg'), quality=90); print('ring floor + canvas')
def circus_floor():
    rnd = random.Random(10); im = Image.merge('RGB', [_noise(FW_, FH_, 2, 6).point(lambda v: 96 + v // 5), _noise(FW_, FH_, 2, 6).point(lambda v: 66 + v // 6), _noise(FW_, FH_, 2, 6).point(lambda v: 38 + v // 8)])
    im = ImageChops.multiply(im, Image.merge('RGB', [_noise(FW_, FH_, 60, 11).point(lambda v: 200 + v // 5)] * 3))
    try:
        art = Image.open(os.path.join(FF, 'circus_ring.webp')).convert('RGB').resize((int(12.8 * FPX), int(12.8 * FPX)))
        box_ = (int(FX(-6.4)), int(FZ(6.4)), int(FX(-6.4)) + art.width, int(FZ(6.4)) + art.height); art = Image.blend(im.crop(box_), art, 0.42)   # low contrast so feet and apparatus read
        mk = Image.new('L', art.size, 0); ImageDraw.Draw(mk).ellipse([0, 0, art.width, art.height], fill=255); im.paste(art, box_[:2], mk)
    except Exception as e: print('no circus art', e)
    im.save(os.path.join(OUT, 'circus_full.jpg'), quality=90); print('circus floor')

def sb_ends():
    """the end faces of the board for the other nights: hockey score, the fight card, the concert and circus feeds"""
    W_, H_ = 1760, 1210; logo = Image.open(os.path.join(OUT, 'logo_white.png'))
    def base(): im = Image.new('RGB', (W_, H_), (4, 5, 12)); return im, ImageDraw.Draw(im)
    im, d = base(); d.rectangle([0, 0, 876, 190], fill=(29, 66, 138)); d.rectangle([884, 0, W_, 190], fill=(200, 200, 205))
    cx(d, 438, 'N3W YORKERS', 98, font(SKY, 100), (246, 243, 234)); cx(d, 1322, 'NIGHT SHIFT', 98, font(SKY, 100), (12, 14, 22))
    cx(d, 438, '3', 470, font(ANTON, 430), (245, 132, 38)); cx(d, 1322, '2', 470, font(ANTON, 430), (246, 243, 234))
    cx(d, 880, '14:22', 820, font(MONO, 200), (255, 210, 58)); cx(d, 240, 'PERIOD 3', 820, font(MONO, 70), (138, 147, 176)); cx(d, 1520, 'SOG 31 24', 820, font(MONO, 70), (138, 147, 176))
    g = logo.copy(); g.thumbnail((300, 300)); im.paste(g, (730, 900), g); cx(d, 380, 'POWER PLAY', 1050, font(SKY, 80), (255, 79, 163)); cx(d, 1380, 'BY MLOW', 1050, font(SKY, 90), (240, 244, 248))
    im.save(os.path.join(OUT, 'sb_end_hockey.jpg'), quality=90)
    im, d = base(); d.rectangle([0, 0, W_, 200], fill=(20, 40, 110)); cx(d, W_ // 2, 'ROUND 7', 100, font(ANTON, 150), (246, 243, 234))
    cx(d, 880, '2:14', 470, font(MONO, 330), (255, 210, 58))
    d.rectangle([0, 700, 860, 900], fill=(29, 66, 138)); d.rectangle([900, 700, W_, 900], fill=(163, 32, 43))
    cx(d, 430, 'THE CABBIE', 800, font(SKY, 96), (246, 243, 234)); cx(d, 1330, 'THE HUSTLER', 800, font(SKY, 96), (246, 243, 234))
    g = logo.copy(); g.thumbnail((240, 240)); im.paste(g, (760, 940), g); cx(d, 380, 'MIDDLEWEIGHT', 1060, font(MONO, 60), (138, 147, 176)); cx(d, 1380, '12 ROUNDS', 1060, font(MONO, 60), (138, 147, 176))
    im.save(os.path.join(OUT, 'sb_end_boxing.jpg'), quality=90)
    for k, (tag, word) in enumerate((('concert', 'LIVE AT THE GARDEN'), ('circus', 'THE GREATEST NIGHT'))):
        im = artgrid(W_, H_, 2, 60 + k, logo_every=2); d = ImageDraw.Draw(im); d.rectangle([0, H_ - 170, W_, H_], fill=(4, 5, 12)); cx(d, W_ // 2, word, H_ - 85, font(SKY, 100), (240, 244, 248))
        im.save(os.path.join(OUT, f'sb_end_{tag}.jpg'), quality=90)
    print('sb ends')

if __name__ == '__main__':
    import sys
    if 'jerseys' in sys.argv: jerseys()
    elif 'round3' in sys.argv: ribbon3(); court_wear()
    elif 'floors' in sys.argv: ice(); stage_floor(); ring_floor(); circus_floor(); sb_ends()
    else: court(); banners(); scoreboard(); ribbon(); jerseys()
