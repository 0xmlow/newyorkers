"""One pass cut of the film: 13 photoreal clips + title + end card, plaques drawn by ffmpeg, the Lyria score under the per shot foley.
Single ffmpeg invocation, nothing written but the final MP4 (the disk has no room for intermediates).
    python3 cut.py ../DELIVERABLES/film/photoreal ../DELIVERABLES/film/audio/lyria_basement.mp3 ../DELIVERABLES/film/foley your_moms_basement_photoreal
"""
import os, subprocess, sys, json
from film import SEGS, esc, W, HH, FPS, TT
src, music, foley, name = sys.argv[1:5]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'DELIVERABLES', 'film')
nf, mf = os.path.join(TT, 'ArchivoNarrow-700.ttf'), os.path.join(TT, 'IBMPlexMono-600.ttf')
dur = lambda f: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or 0)
if src.endswith('.json'):
    U = json.load(open(src)); clips = [(k, U['seg%02d' % k]) for k, _ in enumerate(SEGS) if 'seg%02d' % k in U]
else: clips = [(k, os.path.join(src, 'seg%02d.mp4' % k)) for k, _ in enumerate(SEGS) if os.path.exists(os.path.join(src, 'seg%02d.mp4' % k))]
TITLE, END = 4.0, 4.0
inputs = ['-f', 'lavfi', '-i', f'color=c=0x0D0D0D:s={W}x{HH}:r={FPS}:d={TITLE}', '-f', 'lavfi', '-i', f'color=c=0x0D0D0D:s={W}x{HH}:r={FPS}:d={END}']
for k, f in clips: inputs += ['-i', f]
inputs += ['-i', music]; mi = inputs.count('-i') - 1
fol = []; offs = TITLE
for k, f in clips:
    ff = os.path.join(foley, 'seg%02d.mp4' % k)
    if os.path.exists(ff): inputs += ['-i', ff]; fol.append((inputs.count('-i') - 1, offs))
    offs += dur(f)
total = offs + END
fc = [f"[0:v]drawtext=fontfile='{nf}':text='{esc(chr(34) + 'YOUR MOM' + chr(8217) + 'S BASEMENT' + chr(34))}':fontcolor=white:fontsize=110:x=(w-tw)/2:y=(h-th)/2-60,drawtext=fontfile='{mf}':text='{esc('A WALKABLE BASEMENT UNDER A TWO FAMILY HOUSE IN QUEENS. 120 NEW YORKERS. 20 MEME SCULPTURES. ONE BAGEL.')}':fontcolor=0x2962FF:fontsize=26:x=(w-tw)/2:y=(h-th)/2+70,fade=t=in:st=0:d=0.5,fade=t=out:st={TITLE-0.6}:d=0.6[t]",
      f"[1:v]drawtext=fontfile='{nf}':text='n3wyorkers.com':fontcolor=white:fontsize=96:x=(w-tw)/2:y=(h-th)/2-60,drawtext=fontfile='{mf}':text='{esc('NEW YORKERS BY MLOW. ENGINE FOOTAGE, AI FINISHED ON FLORA. SHE IS UPSTAIRS.')}':fontcolor=0x2962FF:fontsize=26:x=(w-tw)/2:y=(h-th)/2+70,fade=t=in:st=0:d=0.5,fade=t=out:st={END-0.6}:d=0.6[e]"]
vs = ['[t]']
for i, (k, f) in enumerate(clips):
    ri, title, line = SEGS[k]; d = dur(f)
    fc.append(f"[{i+2}:v]scale={W}:{HH}:force_original_aspect_ratio=decrease,pad={W}:{HH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={FPS},drawbox=x=0:y=h-150:w=iw:h=150:color=black@0.72:t=fill,"
              f"drawtext=fontfile='{nf}':text='{esc(title)}':fontcolor=white:fontsize=46:x=60:y=h-128,drawtext=fontfile='{mf}':text='{esc(line)}':fontcolor=0x2962FF:fontsize=22:x=60:y=h-62,"
              f"drawtext=fontfile='{mf}':text='NEW YORKERS BY MLOW':fontcolor=white:fontsize=20:x=w-tw-60:y=h-62,fade=t=in:st=0:d=0.4,fade=t=out:st={max(0, d-0.4):.2f}:d=0.4[v{i}]"); vs.append(f'[v{i}]')
vs.append('[e]')
fc.append(''.join(vs) + f"concat=n={len(vs)}:v=1:a=0[vout]")
amix = [f"[{mi}:a]volume=0.9,afade=t=out:st={total-3:.2f}:d=3[m]"]
for i, (idx, off) in enumerate(fol): amix.append(f"[{idx}:a]volume=0.5,adelay={int(off*1000)}|{int(off*1000)}[f{i}]")
amix.append('[m]' + ''.join(f'[f{i}]' for i in range(len(fol))) + f"amix=inputs={len(fol)+1}:duration=first:normalize=0[aout]")
dst = os.path.join(OUT, name + '.mp4')
cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + inputs + ['-filter_complex', ';'.join(fc + amix), '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-t', f'{total:.2f}', '-movflags', '+faststart', dst]
print('total', round(total, 1), 's', len(clips), 'clips', len(fol), 'foley'); subprocess.run(cmd, check=True); print(dst, os.path.getsize(dst) // 1024 // 1024, 'MB')
