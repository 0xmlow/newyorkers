#!/usr/bin/env python3
"""shot.py <gallery dir> <out_dir> name=query [name=query ...] [--wait s] [--eval JS] [--w 1600 --h 900] [--mobile]
Headless Chromium (the Playwright build, SwiftShader GL) against <gallery>/site served on a free port. Each name=query
opens index.html?auto=1&nolock&<query>, waits, optionally runs JS, and writes <out_dir>/<name>.jpg. Console errors are printed."""
import argparse, http.server, json, os, socketserver, subprocess, sys, threading, time
ap = argparse.ArgumentParser(); ap.add_argument('gallery'); ap.add_argument('out'); ap.add_argument('shots', nargs='+'); ap.add_argument('--wait', type=float, default=9); ap.add_argument('--eval', default=''); ap.add_argument('--w', type=int, default=1280); ap.add_argument('--h', type=int, default=720); ap.add_argument('--mobile', action='store_true')
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
SITE = os.path.join(os.path.abspath(a.gallery), 'site')
js = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shot.js')
r = subprocess.run(['node', js, SITE, a.out, json.dumps(a.shots), str(a.wait), a.eval, str(a.w), str(a.h), '1' if a.mobile else '0'], text=True)
sys.exit(r.returncode)
