"""MEME ISLAND, the three minute film. Every frame is the real engine, rendered headless at 1920x1080,
stepped at exactly 1/30 s, branded in PIL and piped straight into ffmpeg: nothing touches the disk but the MP4.

    python3 film.py               # whole film -> DELIVERABLES/film/meme_island_film_video.mp4
    python3 film.py --only 3      # one segment, for checking
    python3 film.py --mux music.mp3
    python3 film.py --mux music.mp3 --name X --foley DIR    # score plus the per shot sound in DIR/segNN.mp4
    python3 film.py --assemble DIR [--name X]  # captions, mark, fades and cards over DIR/segNN.mp4 (e.g. the photoreal pass)
    python3 film.py --clean       # every segment bare (no plaque, no mark, no fades) -> DELIVERABLES/film/clean/segNN.mp4
"""
import base64, io, json, os, subprocess, sys, time
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from cdp import Page

H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'film'); os.makedirs(OUT, exist_ok=True)
W, HH, FPS = 1920, 1080, 30
FF = 'ffmpeg'
TT = os.path.join(H, 'cache', 'ttf')
NARROW = lambda s: ImageFont.truetype(os.path.join(TT, 'ArchivoNarrow-700.ttf'), s)
MONO = lambda s, w=400: ImageFont.truetype(os.path.join(TT, f'IBMPlexMono-{w}.ttf'), s)
SERIF = lambda s: ImageFont.truetype(os.path.join(TT, 'InstrumentSerif-400.ttf'), s)
def tracked(d, xy, text, font, fill, track=0.0, anchor_center=False, width=None):
    # draw with letter spacing; returns the drawn width
    x, y = xy; sp = font.size * track; w = sum(d.textlength(ch, font=font) for ch in text) + sp * max(0, len(text) - 1)
    if anchor_center: x = (width - w) / 2
    for ch in text: d.text((x, y), ch, font=font, fill=fill); x += d.textlength(ch, font=font) + sp
    return w
def twidth(d, text, font, track=0.0): return sum(d.textlength(ch, font=font) for ch in text) + font.size * track * max(0, len(text) - 1)
INK, WHITE, BLUE = (13, 13, 13), (255, 255, 255), (41, 98, 255)
D = (2026, 10, 7)
# rail name, local time, weather, prep js, title, line
SEGS = [
  ('arrivals', (*D, 17, 50), None, '', '"ARRIVALS"', 'MANHATTAN IS THE SMALL ISLAND OVER THERE.'),
  ('great wave', (*D, 17, 30), None, '', '"THE GREAT WAVE"', 'ONE OF 66 MEME SCULPTURES BY MLOW'),
  ('floor mountain', (*D, 16, 0), None, '', '"THE FLOOR"', 'ALL 527 CARDS. WATCH YOUR STEP. IT HAS REPRICED.'),
  ('sculpture rows', (*D, 15, 30), None, '', '"SEIZE"', 'THE MEMES BY 6529, NOW MONUMENTAL'),
  ('factory', (*D, 11, 0), None, 'g.seize()', '"MEMES OF PRODUCTION"', 'PULL THE LEVER. SEIZE THE MEANS.'),
  ('brain', (*D, 13, 0), None, '', '"BRAIN"', 'PLEASE REMOVE CONVICTION BEFORE ENTERING.'),
  ('lighthouse', (*D, 17, 55), None, '', '"HARDWARE WALLET LIGHTHOUSE"', 'THIS LIGHTHOUSE CANNOT RECOVER YOUR PASSWORD.'),
  ('vault', (*D, 12, 0), None, 'g.openVault()', '"THE VAULT"', 'SIX KEYS. NOT YOUR KEYS? NOW THEY ARE.'),
  ('open metaverse portal', (*D, 14, 30), None, '', '"OPEN METAVERSE"', 'DOOR SOMEHOW CLOSED.'),
  ('wagmi wheel', (*D, 18, 25), None, '', '"WAGMI"', 'PLEASE REMAIN SEATED.'),
  ('survive bunker', (*D, 12, 30), None, '', '"SURVIVE"', 'SURVIVE FIRST. REBRAND LATER.'),
  ('bank', (*D, 10, 30), None, '', '"FIRST NATIONAL BANK OF JPGs"', 'YOUR JPG IS IMPORTANT TO OUR COLLECTION.'),
  ('summer.jpg', (*D, 12, 0), None, '', '"SUMMER.JPG"', 'WEATHER UPDATES DISABLED.'),
  ('census walk', (*D, 9, 30), None, '', '"THE CENSUS WALK"', 'NEW YORKERS BY MLOW. MLOW PAINTED THE PEOPLE.'),
  ('bodega', (*D, 15, 0), None, '', '"6529 BODEGA"', 'OPEN BEFORE AND AFTER THE CYCLE.'),
  ('gm beach', (*D, 7, 0), None, '', '"GM BEACH"', 'GM IS A RENEWABLE RESOURCE.'),
  ('colossus', (*D, 17, 45), None, '', '"THE COLOSSUS OF 6529"', 'LIBERTY NOW SUPPORTS SELF CUSTODY.'),
  ('aerial', (*D, 17, 5), None, 'g.TIME.mode = "lapse"', '"LIVE NEW YORK SKY"', 'THE REAL SUN AND MOON OVER THE HARBOUR, EVERY MINUTE.'),
  ('harbour night', (2026, 10, 31, 21, 30), None, 'g.FW.show = 40', '"FIREWORKS"', 'BITCOIN WHITEPAPER DAY. THE CALENDAR IS REAL.'),
]
TITLE_S, END_S, FADE = 5.0, 7.0, 8

def rgba(path, h):
    im = Image.open(path).convert('RGBA'); return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
LOGO = rgba(os.path.join(H, 'cache', 'logo_white_full.png'), 64)
EYE = rgba(os.path.join(H, 'cache', 'eye_truecolor.png'), int(HH * 0.07))
EYE.putalpha(EYE.split()[3].point(lambda a: int(a * 0.35)))

def caption(im, title, line, k):
    """Gallery plaque, lower left: ink plate, white hairline, white condensed caps title, blue rule, blue mono line."""
    if k <= 0: return
    ft, fl = NARROW(62), MONO(24, 600); d0 = ImageDraw.Draw(im)
    tw = int(max(twidth(d0, title, ft, 0.02), twidth(d0, line, fl, 0.1)) + 88)
    plate = Image.new('RGBA', (tw, 168), INK + (int(232 * k),)); d = ImageDraw.Draw(plate)
    d.rectangle((7, 7, tw - 8, 160), outline=WHITE + (int(220 * k),), width=2)
    tracked(d, (44, 22), title, ft, WHITE + (int(255 * k),), 0.02)
    d.rectangle((44, 98, 44 + 70, 102), fill=BLUE + (int(255 * k),))
    tracked(d, (44, 116), line, fl, BLUE + (int(255 * k),), 0.1)
    x = 72 - int((1 - k) * 40); im.alpha_composite(plate, (x, HH - 168 - 72))

def brand(im, t_in_film):
    im.alpha_composite(EYE, (W - EYE.width - int(W * 0.03), HH - EYE.height - int(HH * 0.03)))
    d = ImageDraw.Draw(im); tracked(d, (72, 56), 'MEME ISLAND', MONO(18, 600), WHITE + (220,), 0.18)

def title_card(u):
    im = Image.new('RGBA', (W, HH), INK + (255,)); d = ImageDraw.Draw(im)
    a = min(1, u * 2.5) * min(1, (1 - u) * 4)
    lg = LOGO.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a))); im.alpha_composite(lg, ((W - lg.width) // 2, HH // 2 - 210))
    f = SERIF(190); s = 'MEME ISLAND'; d.text(((W - d.textlength(s, font=f)) / 2, HH // 2 - 120), s, font=f, fill=WHITE + (int(255 * a),))
    d.rectangle((W // 2 - 50, HH // 2 + 108, W // 2 + 50, HH // 2 + 112), fill=BLUE + (int(255 * a),))
    tracked(d, (0, HH // 2 + 136), '527 MEMES  ·  66 SCULPTURES  ·  ONE ISLAND', MONO(22, 600), BLUE + (int(255 * a),), 0.14, True, W)
    return im

def end_card(u):
    im = Image.new('RGBA', (W, HH), INK + (255,)); d = ImageDraw.Draw(im); a = min(1, u * 3)
    k = lambda i: max(0, min(1, (u - i * 0.08) * 4))
    f = SERIF(160); s = 'MEME ISLAND'; d.text(((W - d.textlength(s, font=f)) / 2, HH // 2 - 250 + (1 - k(0)) * 20), s, font=f, fill=WHITE + (int(255 * k(0) * a),))
    d.rectangle((W // 2 - 50, HH // 2 - 40, W // 2 + 50, HH // 2 - 36), fill=BLUE + (int(255 * k(1) * a),))
    tracked(d, (0, HH // 2 - 6 + (1 - k(1)) * 20), 'THE MEMES BY 6529  ×  NEW YORKERS BY MLOW', NARROW(40), WHITE + (int(255 * k(1) * a),), 0.04, True, W)
    tracked(d, (0, HH // 2 + 58 + (1 - k(2)) * 20), 'A WALKABLE ISLAND THAT KEEPS NEW YORK TIME', MONO(20), WHITE + (int(235 * k(2) * a),), 0.14, True, W)
    tracked(d, (0, HH // 2 + 128 + (1 - k(3)) * 20), 'n3wyorkers.com', MONO(34, 600), BLUE + (int(255 * k(3) * a),), 0.04, True, W)
    lg = LOGO.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a * k(4)))); im.alpha_composite(lg, ((W - lg.width) // 2, HH // 2 + 230))
    return im

def seg_encoder(path):
    return subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-',
                             '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path], stdin=subprocess.PIPE)

def main():
    clean = '--clean' in sys.argv
    if clean: os.makedirs(os.path.join(OUT, 'clean'), exist_ok=True)
    only = [int(x) for x in sys.argv[sys.argv.index('--only') + 1].split(',')] if '--only' in sys.argv else None
    name = f'seg{only[0]:02d}' if only is not None else 'meme_island_film_video'
    out = os.path.join(OUT, name + '.mp4')
    enc = None if clean else subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    put = lambda im: enc.stdin.write(im.convert('RGB').tobytes())
    if only is None and not clean:
        for f in range(int(TITLE_S * FPS)): put(title_card(f / (TITLE_S * FPS)))
    p = Page.open('http://127.0.0.1:4207/index.html?film=1', W, HH); time.sleep(4)
    p.eval(open(os.path.join(H, 'capture_lib.js')).read()); print('boot', p.eval(f'__cap.boot({W},{HH})')); print('sculptures', p.eval('__cap.loadAll()', timeout=900))
    tour = [r['name'] for r in p.eval('__game.TOUR.map(r => ({ name: r.name, dur: r.dur }))')]
    durs = {r['name']: r['dur'] for r in p.eval('__game.TOUR.map(r => ({ name: r.name, dur: r.dur }))')}
    last = None; t_film = TITLE_S
    for si, (rail, when, wx, prep, title, line) in enumerate(SEGS):
        if only is not None and si not in only: continue
        i = tour.index(rail); dur = durs[rail]; n = int(dur * FPS); t0 = time.time()
        p.eval(f'__cap.set({json.dumps(list(when))}, {json.dumps(wx)}, {json.dumps(prep)})')
        p.eval(f'__cap.railAt({i}, 0); __game.TIME.mode = {json.dumps("lapse" if "lapse" in prep else "fixed")}; __cap.settle(150)')
        if 'FW' in prep: p.eval('__cap.settle(150)')
        p.eval(f'__game.playRail(Object.assign({{}}, __game.TOUR[{i}], {{ done: null }})); __game.RAIL.dur = {dur}')
        if clean:
            se = seg_encoder(os.path.join(OUT, 'clean', f'seg{si:02d}.mp4'))
            for f in range(n):
                d = p.eval(f'__game.step({1 / FPS}, 1); __cap.grab(0.9)'); se.stdin.write(Image.open(io.BytesIO(base64.b64decode(d.split(',', 1)[1]))).convert('RGB').tobytes())
            se.stdin.close(); se.wait(); print(f'{si:02d} {rail} clean {n} frames {time.time() - t0:.0f}s', flush=True); continue
        for f in range(n):
            d = p.eval(f'__game.step({1 / FPS}, 1); __cap.grab(0.9)')
            im = Image.open(io.BytesIO(base64.b64decode(d.split(',', 1)[1]))).convert('RGBA')
            if f < FADE and last is not None: im = Image.blend(last, im, (f + 1) / (FADE + 1))
            u = f / n; k = min(1, max(0, (u - 0.08) * 5)) * min(1, max(0, (0.92 - u) * 6))
            caption(im, title, line, k); brand(im, t_film + f / FPS); put(im)
            if f == n - 1: last = im
        t_film += dur; print(f'{si:02d} {rail} {n} frames {time.time() - t0:.0f}s', flush=True)
    p.close()
    if clean: return
    if only is None:
        for f in range(int(END_S * FPS)): put(end_card(f / (END_S * FPS)))
    enc.stdin.close(); enc.wait(); print('wrote', out, os.path.getsize(out) // 1024, 'KB')

def read_clip(path, n):
    """Yield exactly n frames of W x HH: scaled to cover, retimed to the segment's length."""
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout)
    vf = f'setpts=PTS*{n / FPS / dur:.6f},fps={FPS},scale={W}:{HH}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{HH}'
    pr = subprocess.Popen([FF, '-v', 'error', '-i', path, '-vf', vf, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    k, im = 0, None  # streamed, so a 14 s clip never sits in memory whole
    while k < n:
        b = pr.stdout.read(W * HH * 3)
        if len(b) == W * HH * 3: im = Image.frombytes('RGB', (W, HH), b)
        yield im; k += 1
    pr.stdout.close(); pr.wait()

def assemble(src, name):
    """Same cut as main(), but the pictures come from DIR/segNN.mp4 instead of the live engine."""
    durs = {SEGS[i][0]: d for i, d in enumerate(SEG_DURS)}
    out = os.path.join(OUT, name + '_video.mp4')
    enc = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{HH}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    put = lambda im: enc.stdin.write(im.convert('RGB').tobytes())
    for f in range(int(TITLE_S * FPS)): put(title_card(f / (TITLE_S * FPS)))
    last = None; t_film = TITLE_S
    for si, (rail, when, wx, prep, title, line) in enumerate(SEGS):
        n = int(durs[rail] * FPS); fs = read_clip(os.path.join(src, f'seg{si:02d}.mp4'), n)
        for f, fr in enumerate(fs):
            im = fr.convert('RGBA')
            if f < FADE and last is not None: im = Image.blend(last, im, (f + 1) / (FADE + 1))
            u = f / n; k = min(1, max(0, (u - 0.08) * 5)) * min(1, max(0, (0.92 - u) * 6))
            caption(im, title, line, k); brand(im, t_film + f / FPS); put(im)
            if f == n - 1: last = im
        t_film += durs[rail]; print(f'{si:02d} {rail} {n}', flush=True)
    for f in range(int(END_S * FPS)): put(end_card(f / (END_S * FPS)))
    enc.stdin.close(); enc.wait(); print('wrote', out, os.path.getsize(out) // 1024, 'KB')

SEG_DURS = [10, 9, 10, 9, 8, 9, 11, 8, 7, 10, 9, 8, 8, 9, 6, 8, 10, 14, 9]

def foley_bed(src, out):
    """One wav with each DIR/segNN audio laid at its place in the cut (after the title card), half second crossfades, silence where a shot has none."""
    ins, parts, t = [], [], TITLE_S
    for si, d in enumerate(SEG_DURS):
        f = os.path.join(src, f'seg{si:02d}.mp4')
        has = os.path.exists(f) and 'audio' in subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout
        if has:
            k = len(ins) // 2; ins += ['-i', f]
            parts.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:{d + 0.5},afade=t=in:d=0.4,afade=t=out:st={d - 0.1}:d=0.6,adelay={int(t * 1000)}|{int(t * 1000)}[f{k}]')
        t += d
    n = len(parts); labels = ''.join(f'[f{k}]' for k in range(n))
    fc = ';'.join(parts) + f';{labels}amix=inputs={n}:normalize=0,apad,atrim=0:{t + END_S}[o]'
    subprocess.run([FF, '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', '[o]', '-ar', '48000', out], check=True)

def mux(music, start=0.0, name='meme_island_film', foley=None):
    v = os.path.join(OUT, name + '_video.mp4'); o = os.path.join(OUT, name + '.mp4')
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout)
    score = f'[1:a]apad,afade=t=in:d=1.5,afade=t=out:st={dur - 6}:d=5.5,volume=0.95'
    if foley:  # score on top, the island's own sound underneath, ducked while the score swells
        bed = os.path.join(H, 'cache', name + '_foley.wav'); foley_bed(foley, bed)
        fc = f'{score}[m];[2:a]volume=0.42,apad[f];[m][f]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]'
        extra = ['-i', bed]
    else: fc, extra = score + '[a]', []
    subprocess.run([FF, '-v', 'error', '-y', '-i', v, '-ss', str(start), '-i', music, *extra, '-filter_complex', fc,
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(dur), '-movflags', '+faststart', o], check=True)
    print('wrote', o, os.path.getsize(o) // 1024, 'KB')

if __name__ == '__main__':
    nm = sys.argv[sys.argv.index('--name') + 1] if '--name' in sys.argv else 'meme_island_film'
    if '--assemble' in sys.argv: assemble(sys.argv[sys.argv.index('--assemble') + 1], nm)
    elif '--mux' in sys.argv: mux(sys.argv[sys.argv.index('--mux') + 1], float(sys.argv[sys.argv.index('--start') + 1]) if '--start' in sys.argv else 0.0, nm,
                                 sys.argv[sys.argv.index('--foley') + 1] if '--foley' in sys.argv else None)
    else: main()
