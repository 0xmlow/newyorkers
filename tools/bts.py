"""tools/bts.py: the behind the scenes film, 4/10 to now, from the real artifacts of the build. 16:9 and 9:16, silent
(captions carry it; add a score in the edit). Writes work/bts/THE_LIGHTINGS_BTS_16x9.mp4 and _9x16.mp4."""
import os, subprocess, shutil, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); W_ = os.path.join(R, "work"); OUT = os.path.join(W_, "bts"); SEG = os.path.join(OUT, "seg"); os.makedirs(SEG, exist_ok=True)
GB = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"; GI = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"; MONO = "/System/Library/Fonts/Menlo.ttc"
INK, BONE, GOLD, BLUE = (5, 7, 12), (242, 235, 221), (200, 160, 64), (41, 98, 255)
FLOWER = "/Users/degens/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/782bdcfa-efbb-4f97-ac74-d97c73bc6dee/ab1a3ffb-cac2-4835-b4f4-489a319b8167/skills/apply-mlow-impermanent-vision/assets/reference-open-eye-flower.jpg"
def F(p, s): return ImageFont.truetype(p, s)
def canvas(w, h): return Image.new("RGB", (w, h), INK)
def center(d, text, font, y, w, fill):
    lines = []
    for para in text.split("\n"):   # wrap anything wider than 88% of the frame (the 9:16 cut)
        cur = ""
        for word in para.split(" "):
            t = (cur + " " + word).strip()
            if d.textlength(t, font=font) > w * 0.88 and cur: lines.append(cur); cur = word
            else: cur = t
        lines.append(cur)
    for i, line in enumerate(lines):
        tw = d.textlength(line, font=font); d.text(((w - tw) / 2, y + i * font.size * 1.18), line, font=font, fill=fill)
def card(name, kicker, big, small, w, h, bigsize=None, bigfill=BONE):
    im = canvas(w, h); d = ImageDraw.Draw(im); s = h / 1080
    side = max(w, h); fl = Image.open(FLOWER).convert("RGB").resize((side, side)).filter(ImageFilter.GaussianBlur(3)); fl = fl.crop(((side - w) // 2, (side - h) // 2, (side - w) // 2 + w, (side - h) // 2 + h))
    im = Image.blend(im, fl, 0.2)   # the eye flower behind everything, full bleed
    d = ImageDraw.Draw(im)
    if kicker: center(d, kicker, F(MONO, int(40 * s)), h * 0.28, w, GOLD)
    nb = big.count("\n") + 1; bs = bigsize or (int(230 * s) if len(big) < 8 else int(104 * s)); center(d, big, F(GB, bs), h * 0.5 - nb * bs * 0.6, w, bigfill)
    if small: center(d, small, F(GI, int(46 * s)), h * 0.5 + nb * bs * 0.62 + 20 * s, w, (154, 168, 200))
    p = os.path.join(SEG, name + ".png"); im.save(p); return p
def still(name, src, caption, w, h, tag=None):
    im = canvas(w, h); s = Image.open(src).convert("RGB")
    import numpy as np; a = np.asarray(s).copy(); a[(a[:, :, 0] > 245) & (a[:, :, 1] > 245) & (a[:, :, 2] > 245)] = INK; s = Image.fromarray(a)   # contact sheet padding to ink
    m = 0.86 if w > h else 0.95; s.thumbnail((int(w * m), int(h * (0.72 if w > h else 0.55))), Image.LANCZOS)
    x, y = (w - s.width) // 2, int(h * (0.1 if w > h else 0.22)); im.paste(s, (x, y)); d = ImageDraw.Draw(im); sc = h / 1080 if w > h else w / 1080
    center(d, caption, F(GB, int(56 * sc)), y + s.height + int(30 * sc), w, BONE)
    if tag: tf = F(GB, int(64 * sc)); d.rectangle([x + 20, y + 20, x + 40 + d.textlength(tag, font=tf), y + 30 + tf.size * 1.25], fill=BLUE); d.text((x + 30, y + 22), tag, font=tf, fill=(255, 255, 255))
    p = os.path.join(SEG, name + ".png"); im.save(p); return p
def seg_png(png, dur, out, push=True):
    z = "zoompan=z='min(zoom+0.0006,1.06)':d=%d:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=%s:fps=30" % (int(dur * 30), SIZE) if push else f"scale={SIZE},fps=30"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", str(dur), "-i", png, "-vf", f"{z},format=yuv420p", "-t", str(dur), "-c:v", "libx264", "-crf", "18", "-r", "30", out], check=True)
def seg_clip(clip, ss, dur, caption, out, w, h):
    bg = canvas(w, h); d = ImageDraw.Draw(bg); sc = h / 1080 if w > h else w / 1080; sz = int(min(w, h) * (0.8 if w > h else 0.96)); ytop = int((h - sz) / 2) if w > h else int(h * 0.2)
    center(d, caption, F(GB, int(54 * sc)), ytop + sz + int(18 * sc) if w <= h else h - int(96 * sc), w, BONE); bgp = out + ".bg.png"; bg.save(bgp)
    x = (w - sz) // 2 if w > h else (w - sz) // 2
    if w > h: x = int(w * 0.5 - sz / 2)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", bgp, "-ss", str(ss), "-t", str(dur), "-i", clip, "-filter_complex", f"[1:v]scale={sz}:{sz}[c];[0:v][c]overlay={x}:{ytop if w <= h else int((h - sz) / 2 - 30 * sc)}:shortest=1,fps=30,format=yuv420p", "-t", str(dur), "-c:v", "libx264", "-crf", "18", "-r", "30", out], check=True)
    os.remove(bgp)
C = os.path.join(W_, "clips")
PLAN = [
    ("card", "c01", "BEHIND THE SCENES", "THE LIGHTINGS", "the tree, the menorahs and the city that switches itself on", 2.4),
    ("card", "c02", "MY VERDICT ON ROUND ONE", "4/10", "", 2.0),
    ("still", "s01", os.path.join(OUT, "v1_sheet.jpg"), "Nine rooms. Built in a day. Looked like it.", 3.0, "v1"),
    ("card", "c03", "THE AI ART DIRECTOR (GPT 6 ASTRA, ON KREA)", "“Nine versions of the same\nexhibition box.”", "", 3.0),
    ("still", "s02", os.path.join(W_, "ref_onloc.jpg"), "The bar: ON LOCATION, my movie sets gallery.", 2.6, None),
    ("still", "s03", os.path.join(W_, "v21_sheet.jpg"), "Facades, puddles, bulbs, ads for my own sites.", 3.0, "v2"),
    ("card", "c04", "ASTRA, ROUND TWO", "“Stop adding content.\nFix the light.”", "", 2.6),
    ("still", "s04", os.path.join(W_, "v2_marks.jpg"), "Fourteen windows, measured off the photo by hand.", 3.0, None),
    ("still", "s05", os.path.join(W_, "atlas_proof.jpg"), "Sixteen rooms behind every window. Ray traced. Fake.", 3.0, None),
    ("card", "c05", "ASTRA, ROUND THREE", "“Not a blue screen\npasted onto it.”", "", 2.6),
    ("still", "s06", os.path.join(W_, "cc0_thumbs.jpg"), "Real stone, real brick. All CC0.", 2.6, None),
    ("still", "s07", os.path.join(W_, "v4_sheet.jpg"), "Real buildings. Real interiors. My Impermanent Vision on the walls.", 3.0, "v4"),
    ("card", "c08", "MLOW, ROUND SIX", "“The real tree is\nway more massive.”", "", 2.6),
    ("still", "s08", os.path.join(W_, "v6_sheet.jpg"), "So: the real plaza, in metres. The tree is 82 feet. 30 Rock is 850.", 3.2, "v6"),
    ("card", "c06", "", "NOW", "", 1.4),
    ("clip", "k00", os.path.join(C, "sq_channel.mp4"), 1, 4.0, "Down the Channel Gardens."),
    ("clip", "k0r", os.path.join(C, "sq_rink.mp4"), 1, 3.6, "Onto the ice, under Prometheus."),
    ("clip", "k01", os.path.join(C, "sq_tree_lighting.mp4"), 5.5, 4.2, "Press the switch. 22,000 lights."),
    ("clip", "k02", os.path.join(C, "sq_star_lift.mp4"), 19, 4.2, "Then ride into them."),
    ("clip", "k03", os.path.join(C, "sq_tiny.mp4"), 3.2, 3.6, "Shrink onto the model, seventy floors up."),
    ("clip", "k04", os.path.join(C, "sq_melt.mp4"), 3.0, 3.6, "Let the building melt."),
    ("clip", "k05", os.path.join(C, "sq_windows.mp4"), 7, 3.6, "Light one menorah. Fourteen answer."),
    ("clip", "k06", os.path.join(C, "sq_sleigh.mp4"), 2, 3.2, "Even the sky competes in Dyker Heights."),
    ("card", "c07", "A WALKABLE GALLERY BY MLOW", "11/10?", "You decide. N3WYORKERS.COM", 3.0),
]
for tag, w, h in (("16x9", 1920, 1080), ("9x16", 1080, 1920)):
    SIZE = f"{w}x{h}"; parts = []
    for i, it in enumerate(PLAN):
        out = os.path.join(SEG, f"{tag}_{i:02d}.mp4")
        if it[0] == "card": seg_png(card(f"{tag}_{it[1]}", it[2], it[3], it[4], w, h), it[5], out)
        elif it[0] == "still": seg_png(still(f"{tag}_{it[1]}", it[2], it[3], w, h, it[5]), it[4], out)
        else:
            if not os.path.exists(it[2]): print("skip", it[2]); continue
            seg_clip(it[2], it[3], it[4], it[5], out, w, h)
        parts.append(out)
    lst = os.path.join(SEG, f"{tag}.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    final = os.path.join(OUT, f"THE_LIGHTINGS_BTS_{tag}.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", final], check=True)
    print("wrote", final, os.path.getsize(final) // 1024, "KB")
