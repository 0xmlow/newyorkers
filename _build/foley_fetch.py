"""Keep only the audio of each MMAudio result: python3 foley_fetch.py seg url [seg url ...] -> DELIVERABLES/film/foley/segNN.mp4"""
import os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); d = os.path.join(H, '..', 'DELIVERABLES', 'film', 'foley'); os.makedirs(d, exist_ok=True)
a = sys.argv[1:]
for s, u in zip(a[::2], a[1::2]):
    f = os.path.join(d, f'seg{s}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', u, '-vn', '-c:a', 'copy', f], check=True); print(s, os.path.getsize(f) // 1024, 'KB')
