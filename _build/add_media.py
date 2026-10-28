#!/usr/bin/env python3
"""add_media.py <slug> [<slug> ...] [--force]: encode a film from _build/media.json into assets/film/<slug>.

Writes what the media room and the gallery pages play: HLS at 1080p and 720p in 6 s chunks (Cloudflare Pages caps a
file at 25 MB), master.m3u8, poster.jpg at poster_t, and a 12 s silent teaser.mp4 cut from the four `teaser` ranges
(skipped when teaser is []). The same recipe as encode_film.sh. Output is gitignored; rerun after a film is re-rendered.
Skips a slug whose folder already has master.m3u8 unless --force. Then run build_media.py and build_seo.py.
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
FF = subprocess.run([sys.executable, "-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], capture_output=True, text=True).stdout.strip() or "ffmpeg"
M = json.load(open(os.path.join(HERE, "media.json")))["films"]
force = "--force" in sys.argv
slugs = [a for a in sys.argv[1:] if not a.startswith("--")] or [f["slug"] for f in M]

def enc(src, out, vf, vb, maxrate, bufsize, ab, sub):
    os.makedirs(os.path.join(out, sub), exist_ok=True)
    return subprocess.Popen([FF, "-v", "error", "-y", "-i", src, "-map", "0:v", "-map", "0:a", *vf, "-c:v", "libx264", "-preset", "slow",
        "-profile:v", "high", "-b:v", vb, "-maxrate", maxrate, "-bufsize", bufsize, "-g", "60", "-keyint_min", "60", "-sc_threshold", "0",
        "-c:a", "aac", "-b:a", ab, "-ac", "2", "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
        "-hls_segment_filename", os.path.join(out, sub, "s%03d.ts"), os.path.join(out, sub, "index.m3u8")])

for slug in slugs:
    F = next((f for f in M if f["slug"] == slug), None)
    if not F: raise SystemExit(f"{slug}: not in media.json")
    src = os.path.join(ROOT, F["src"]); out = os.path.join(SITE, "assets", "film", slug)
    if not os.path.exists(src): raise SystemExit(f"{slug}: source missing: {src}")
    if os.path.exists(os.path.join(out, "master.m3u8")) and not force:
        print(f"{slug}: already encoded (use --force to redo)"); continue
    for sub in ("1080", "720"):
        subprocess.run(["rm", "-rf", os.path.join(out, sub)])
    p1 = enc(src, out, [], "5000k", "6500k", "10000k", "160k", "1080")
    p2 = enc(src, out, ["-vf", "scale=1280:720"], "2800k", "3600k", "5600k", "128k", "720")
    if p1.wait() or p2.wait(): raise SystemExit(f"{slug}: encode failed")
    subprocess.run([FF, "-v", "error", "-y", "-ss", str(F["poster_t"]), "-i", src, "-frames:v", "1", "-vf", "scale=1280:-1", "-q:v", "3", os.path.join(out, "poster.jpg")], check=True)
    open(os.path.join(out, "master.m3u8"), "w").write("#EXTM3U\n#EXT-X-VERSION:3\n"
        '#EXT-X-STREAM-INF:BANDWIDTH=6800000,AVERAGE-BANDWIDTH=5200000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"\n1080/index.m3u8\n'
        '#EXT-X-STREAM-INF:BANDWIDTH=3800000,AVERAGE-BANDWIDTH=2950000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"\n720/index.m3u8\n')
    cuts = F.get("teaser") or []
    if cuts:
        parts = "".join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[c{i}];" for i, (a, b) in enumerate(cuts))
        chain = "".join(f"[c{i}]" for i in range(len(cuts)))
        subprocess.run([FF, "-v", "error", "-y", "-i", src, "-filter_complex", f"{parts}{chain}concat=n={len(cuts)}:v=1,scale=960:-2[v]", "-map", "[v]", "-an",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(out, "teaser.mp4")], check=True)
    size = subprocess.run(["du", "-sh", out], capture_output=True, text=True).stdout.split()[0]
    print(f"{slug}: encoded into assets/film/{slug} ({size})")
