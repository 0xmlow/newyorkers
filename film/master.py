#!/usr/bin/env python3
"""master.py: picture + score into the delivered film, then measure it.
    python3 master.py picture.mp4 render.log.json out.mp4"""
import sys, os, json, subprocess
sys.path.insert(0, '/Users/degens/Desktop/NEW YORKERS BY MLOW/FILM KIT')
import cinekit as ck
HERE = os.path.dirname(os.path.abspath(__file__))
pic, log, out = sys.argv[1:4]
subprocess.run([sys.executable, os.path.join(HERE, 'score.py'), log], check=True)
ck.normalize(os.path.join(HERE, 'score_raw.wav'), os.path.join(HERE, 'score.wav'), lufs=-14.0, tp=-1.5)
# a little film grain over the render, then the score, AAC 256k
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', pic, '-i', os.path.join(HERE, 'score.wav'),
    '-vf', 'noise=alls=3:allf=t', '-c:v', 'libx264', '-crf', '19', '-maxrate', '16M', '-bufsize', '32M', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '256k', '-shortest', out], check=True)
print('loudness', ck.loudness(out))
ev = json.load(open(os.path.join(HERE, 'sync_events.json')))
events = {'hit1': ev['hits']['hit1'], 'hit2': ev['hits']['hit2'], 'drop': ev['hits']['drop'], 'final': ev['final']}
for i, t in enumerate(ev['smash']): events[f'pull{i + 1}'] = t
try: print('sync', ck.sync_check(out, events))
except Exception as e: print('sync_check failed:', e)
print(os.path.getsize(out) / 1e6, 'MB')
