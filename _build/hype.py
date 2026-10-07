"""MEME ISLAND hype cut: the fastest beats of the film master, cut to the loudest stretch of Lyria take B.
    python3 hype.py  ->  DELIVERABLES/hype/meme_island_hype.mp4, then mlow-video-cuts variants
    FILM=meme_island_photoreal python3 hype.py  ->  the same cut from the photoreal film, DELIVERABLES/hype/meme_island_photoreal_hype.mp4"""
import os, subprocess, json, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, '..', 'DELIVERABLES'); OUT = os.path.join(D, 'hype'); os.makedirs(OUT, exist_ok=True)
NAME = os.environ.get('FILM', 'meme_island_film'); FILM = os.path.join(D, 'film', NAME + '_video.mp4'); MUS = os.path.join(D, 'film', 'audio', 'lyria_b.mp3')
# (start in film seconds, length): title, then the beats, then the end card
CUTS = [(2.2, 1.6), (12.0, 1.5), (18.0, 2.0), (29.0, 1.8), (38.0, 1.6), (47.0, 2.2), (55.0, 1.5), (66.0, 2.4), (75.5, 2.0), (83.5, 1.4),
        (91.0, 2.0), (100.5, 1.5), (110.0, 1.4), (124.0, 1.5), (149.0, 2.2), (160.0, 3.0), (171.0, 3.0), (179.0, 4.5)]
total = sum(c[1] for c in CUTS)
# find the loudest window of the hype score
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', MUS, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
a = np.frombuffer(pcm, np.int16).astype(np.float32); sec = a[: len(a) // 8000 * 8000].reshape(-1, 8000); rms = np.sqrt((sec ** 2).mean(1))
w = int(np.ceil(total)); best = int(np.argmax(np.convolve(rms, np.ones(w), 'valid'))); start = max(0, best - 1)
print('score window starts', start, 's, cut length', round(total, 1), 's')
fc, ins = [], []
for i, (s, l) in enumerate(CUTS):
    ins += ['-ss', str(s), '-t', str(l), '-i', FILM]; fc.append(f'[{i}:v]setpts=PTS-STARTPTS,format=yuv420p[v{i}]')
fc.append(''.join(f'[v{i}]' for i in range(len(CUTS))) + f'concat=n={len(CUTS)}:v=1:a=0[v]')
n = len(CUTS); ins += ['-ss', str(start), '-i', MUS]
fc.append(f'[{n}:a]atrim=0:{total},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st={total - 1.5}:d=1.5[a]')
out = os.path.join(OUT, ('meme_island' if NAME == 'meme_island_film' else NAME) + '_hype.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
print('wrote', out, os.path.getsize(out) // 1024, 'KB')
