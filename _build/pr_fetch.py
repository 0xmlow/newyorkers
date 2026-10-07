"""Download finished photoreal clips: python3 pr_fetch.py DIR seg url [seg url ...]"""
import os, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); d = os.path.join(H, '..', 'DELIVERABLES', 'film', sys.argv[1]); os.makedirs(d, exist_ok=True)
a = sys.argv[2:]
for s, u in zip(a[::2], a[1::2]):
    f = os.path.join(d, f'seg{int(s):02d}.mp4'); subprocess.run(['curl', '-s', '-o', f, u], check=True)
    print(s, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height:format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.split())
