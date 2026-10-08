"""YOUR MOM'S BASEMENT, the film. Every frame is the real engine rendered headless at 1920x1080, stepped at exactly 1/30 s,
piped straight into ffmpeg. Clean clips (no plaque, no mark) go to FLORA for the photoreal pass; --assemble lays the
plaques, the mark, the title and the end card over whatever clips you give it.

    python3 film.py --clean                       # DELIVERABLES/film/clean/segNN.mp4, one per tour rail
    python3 film.py --assemble DIR --name X       # captions + mark + title/end over DIR/segNN.mp4 -> DELIVERABLES/film/X.mp4
    python3 film.py --mux music.mp3 --name X [--foley DIR]
"""
import base64, os, subprocess, sys, time, json
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '..', 'DELIVERABLES', 'film'); os.makedirs(OUT, exist_ok=True)
W, HH, FPS = 1920, 1080, 30
FF = 'ffmpeg'; TT = os.path.join(H, 'cache', 'ttf')
# rail index, title, line (Abloh voice, Astra's plaque lines)
SEGS = [
  (0, '"THE STAIRS"', 'YOUR MOM\'S BASEMENT. CULTURAL INSTITUTION. SIDE ENTRANCE.'),
  (1, '"THE WINDOW WELL"', 'THOSE ARE FEET. THAT IS OUTSIDE. NOT RECOMMENDED.'),
  (2, '"THE TV DEN"', 'THE PLASTIC COUCH. COMFORT IS STILL IN THE PACKAGING.'),
  (3, '"THE MIRROR"', 'THAT IS NOT THIS ROOM. IT NEVER WAS.'),
  (4, '"THE CARD ROOM"', 'PROOF OF STAKE. FIVE DOLLAR MINIMUM.'),
  (5, '"BOILER AND LAUNDRY"', 'HEAT INCLUDED. PEACE SEPARATE.'),
  (6, '"THE 1998 PC"', 'YOUR WALLET IS NOW ARCHAEOLOGY.'),
  (7, '"THE INFINITE HALLWAY"', 'COZY. FLEXIBLE LAYOUT.'),
  (8, '"THE EVERYTHING BAGEL"', 'EVERYTHING EXCEPT AN EXIT.'),
  (9, '"THE GREAT WAVE"', 'ONE OF 20 MEME SCULPTURES BY MLOW. IT IS IN THE SCHMEAR.'),
  (10, '"THE RAT KING\'S COURT"', 'LOCAL GOVERNMENT.'),
  (11, '"MOM\'S SECOND FREEZER"', 'YOU KNOW WHAT YOU DID.'),
  (12, '"THE DRYER"', 'ANOTHER CYCLE. SAME BAG.'),
]
def clean():
    from cdp import Page
    LIB = open(os.path.join(H, 'capture_lib.js')).read(); D = os.path.join(OUT, 'clean'); os.makedirs(D, exist_ok=True)
    p = Page.open('http://127.0.0.1:4208/index.html?cap=1', W, HH); time.sleep(4); p.eval(LIB); p.eval('__cap.boot(%d,%d)' % (W, HH)); print('models', p.eval('__cap.loadAll()', timeout=600))
    p.eval('__cap.prep("g.W.freezer.open = true; g.W.freezerLight.intensity = 3; if (g.POST.grade) g.POST.grade.uniforms.uGrain.value = 0;")')
    for k, (ri, title, line) in enumerate(SEGS):
        dst = os.path.join(D, 'seg%02d.mp4' % k)
        if os.path.exists(dst): continue
        dur = p.eval('__game.TOUR[%d].dur' % ri); n = int(dur * FPS); t0 = time.time()
        p.eval('__cap.railAt(%d, 0); __cap.settle(40)' % ri)
        if ri == 10: p.eval('__cap.prep("g.state.idle = 8; g.step(1/60, 240)")')
        p.eval('__game.playRail(Object.assign({}, __game.TOUR[%d], { done: null }))' % ri)
        ff = subprocess.Popen([FF, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst], stdin=subprocess.PIPE)
        for i in range(n):
            p.eval('__game.step(1/%d, 1)' % FPS); d = p.eval('__cap.grab(0.9)'); ff.stdin.write(base64.b64decode(d.split(',', 1)[1]))
        ff.stdin.close(); ff.wait(); print('seg%02d' % k, title, n, 'frames', round(time.time() - t0, 1), 's', os.path.getsize(dst) // 1024, 'KB', flush=True)
    p.close()
def esc(s): return s.replace('\\', '\\\\').replace("'", "’").replace(':', '\\:').replace('%', '\\%')
def assemble(src, name):
    parts = []; T = os.path.join(OUT, 'tmp'); os.makedirs(T, exist_ok=True)
    nf, mf = os.path.join(TT, 'ArchivoNarrow-700.ttf'), os.path.join(TT, 'IBMPlexMono-600.ttf')
    for k, (ri, title, line) in enumerate(SEGS):
        f = os.path.join(src, 'seg%02d.mp4' % k)
        if not os.path.exists(f): print('missing', f); continue
        o = os.path.join(T, 'c%02d.mp4' % k)
        vf = (f"scale={W}:{HH}:force_original_aspect_ratio=decrease,pad={W}:{HH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={FPS},"
              f"drawbox=x=0:y=h-150:w=iw:h=150:color=black@0.72:t=fill,"
              f"drawtext=fontfile='{nf}':text='{esc(title)}':fontcolor=white:fontsize=46:x=60:y=h-128,"
              f"drawtext=fontfile='{mf}':text='{esc(line)}':fontcolor=0x2962FF:fontsize=22:x=60:y=h-62,"
              f"drawtext=fontfile='{mf}':text='NEW YORKERS BY MLOW':fontcolor=white:fontsize=20:x=w-tw-60:y=h-62,fade=t=in:st=0:d=0.4,fade=t=out:st=0:d=0.4:alpha=0")
        subprocess.run([FF, '-y', '-loglevel', 'error', '-i', f, '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', o], check=True); parts.append(o)
    # title and end cards
    def card(path, lines, dur):
        vf = f"drawtext=fontfile='{nf}':text='{esc(lines[0])}':fontcolor=white:fontsize=110:x=(w-tw)/2:y=(h-th)/2-60,drawtext=fontfile='{mf}':text='{esc(lines[1])}':fontcolor=0x2962FF:fontsize=28:x=(w-tw)/2:y=(h-th)/2+70,fade=t=in:st=0:d=0.5,fade=t=out:st={dur-0.6}:d=0.6"
        subprocess.run([FF, '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f'color=c=0x0D0D0D:s={W}x{HH}:r={FPS}:d={dur}', '-vf', vf, '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', path], check=True)
    t, e = os.path.join(T, 'title.mp4'), os.path.join(T, 'end.mp4'); card(t, ["YOUR MOM'S BASEMENT", 'A WALKABLE BASEMENT UNDER A TWO FAMILY HOUSE IN QUEENS. 120 NEW YORKERS. 20 MEME SCULPTURES. ONE BAGEL.'], 4); card(e, ['n3wyorkers.com', 'NEW YORKERS BY MLOW. SHE IS UPSTAIRS.'], 4)
    lst = os.path.join(T, 'list.txt'); open(lst, 'w').write(''.join(f"file '{x}'\n" for x in [t] + parts + [e]))
    dst = os.path.join(OUT, name + '.mp4'); subprocess.run([FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', dst], check=True)
    for x in parts + [t, e]: os.remove(x)
    print(dst, os.path.getsize(dst) // 1024, 'KB')
def mux(music, name, foley=None):
    src = os.path.join(OUT, name + '.mp4'); dst = os.path.join(OUT, name + '_scored.mp4')
    if foley:
        # the per shot foley laid end to end under the score, each one trimmed to its shot
        inputs = ['-i', src, '-i', music]; fl = []; k2 = 0
        for k, _ in enumerate(SEGS):
            f = os.path.join(foley, 'seg%02d.mp4' % k)
            if os.path.exists(f): inputs += ['-i', f]; fl.append((k2 + 2, k)); k2 += 1
        # title card first (4 s), then each shot; offsets come from the clean clip durations
        offs = [4.0];
        for k, _ in enumerate(SEGS):
            f = os.path.join(OUT, 'clean', 'seg%02d.mp4' % k); d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or 0); offs.append(offs[-1] + d)
        fc = ''.join(f'[{i}:a]volume=0.55,adelay={int(offs[k]*1000)}|{int(offs[k]*1000)}[f{i}];' for i, k in fl) + f'[1:a]volume=0.9[m];[m]' + ''.join(f'[f{i}]' for i, k in fl) + f'amix=inputs={len(fl)+1}:duration=first:normalize=0[a]'
        subprocess.run([FF, '-y', '-loglevel', 'error'] + inputs + ['-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', dst], check=True)
    else:
        subprocess.run([FF, '-y', '-loglevel', 'error', '-i', src, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-af', 'afade=t=out:st=0:d=0', dst], check=True)
    print(dst, os.path.getsize(dst) // 1024, 'KB')
if __name__ == '__main__':
    a = sys.argv[1:]
    if '--clean' in a: clean()
    if '--assemble' in a: assemble(a[a.index('--assemble') + 1], a[a.index('--name') + 1] if '--name' in a else 'basement')
    if '--mux' in a: mux(a[a.index('--mux') + 1], a[a.index('--name') + 1] if '--name' in a else 'basement', a[a.index('--foley') + 1] if '--foley' in a else None)
