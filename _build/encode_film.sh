#!/bin/zsh
# The honoraries roll call film as HLS for honoraries.html: 6 s chunks (Pages caps a file at 25 MB), 1080p and 720p.
# Rerun after the film is re-rendered in HONORARIES HYPE FILM 2026-09-26. Output is gitignored.
set -e
cd "${0:A:h}/.."
SRC="../HONORARIES HYPE FILM 2026-09-26/NEW YORKERS THE HONORARIES ROLL CALL.mp4"
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
O=assets/film/roll-call; rm -rf $O; mkdir -p $O/1080 $O/720
enc() { $FF -v error -y -i "$SRC" -map 0:v -map 0:a $1 -c:v libx264 -preset slow -profile:v high -b:v $2 -maxrate $3 -bufsize $4 \
  -g 60 -keyint_min 60 -sc_threshold 0 -c:a aac -b:a $5 -ac 2 -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "$O/$6/s%03d.ts" "$O/$6/index.m3u8"; }
enc "" 5000k 6500k 10000k 160k 1080 &
enc "-vf scale=1280:720" 2800k 3600k 5600k 128k 720 &
wait
$FF -v error -y -ss 10.5 -i "$SRC" -frames:v 1 -vf scale=1280:-1 -q:v 3 $O/poster.jpg
cat > $O/master.m3u8 <<'M'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=6800000,AVERAGE-BANDWIDTH=5200000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3800000,AVERAGE-BANDWIDTH=2950000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720/index.m3u8
M
du -sh $O
