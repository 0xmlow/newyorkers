#!/bin/zsh
# A film master as HLS: 6 s chunks (Pages caps a file at 25 MB), 1080p and 720p. Output is gitignored.
#   ./encode_film.sh                         the honoraries roll call (honoraries.html), from HONORARIES HYPE FILM 2026-09-26
#   ./encode_film.sh city                    THE CITY IS THE ART (home page), from DREAMINA HYPE FILM 2026-10-01
# Rerun after the film is re-rendered.
set -e
cd "${0:A:h}/.."
SRC="../HONORARIES HYPE FILM 2026-09-26/NEW YORKERS THE HONORARIES ROLL CALL.mp4"; O=assets/film/roll-call; PT=10.5
if [ "$1" = "city" ]; then
  SRC="../DREAMINA HYPE FILM 2026-10-01/NEW YORKERS THE CITY IS THE ART.mp4"; O=assets/film/city-is-the-art; PT=11.9
fi
# THE HALL NEW YORK LOST (home page museum invite, room 180), from CENSUS HALL 2026-10-01/film.
# Also cuts a 12 s silent teaser loop (hook, mosh, dither) that autoplays muted in the invite.
if [ "$1" = "hall" ]; then
  SRC="../CENSUS HALL 2026-10-01/film/THE HALL NEW YORK LOST.mp4"; O=assets/film/hall-new-york-lost; PT=2.3
fi
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
rm -rf $O; mkdir -p $O/1080 $O/720
enc() { $FF -v error -y -i "$SRC" -map 0:v -map 0:a ${=1} -c:v libx264 -preset slow -profile:v high -b:v $2 -maxrate $3 -bufsize $4 \
  -g 60 -keyint_min 60 -sc_threshold 0 -c:a aac -b:a $5 -ac 2 -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "$O/$6/s%03d.ts" "$O/$6/index.m3u8"; }
enc "" 5000k 6500k 10000k 160k 1080 &
enc "-vf scale=1280:720" 2800k 3600k 5600k 128k 720 &
wait
$FF -v error -y -ss $PT -i "$SRC" -frames:v 1 -vf scale=1280:-1 -q:v 3 $O/poster.jpg
cat > $O/master.m3u8 <<'M'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=6800000,AVERAGE-BANDWIDTH=5200000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3800000,AVERAGE-BANDWIDTH=2950000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720/index.m3u8
M
if [ "$1" = "hall" ]; then
  $FF -v error -y -i "$SRC" -filter_complex "[0:v]trim=0:3,setpts=PTS-STARTPTS[a];[0:v]trim=30:33,setpts=PTS-STARTPTS[b];[0:v]trim=47:50,setpts=PTS-STARTPTS[c];[0:v]trim=8:11,setpts=PTS-STARTPTS[d];[a][b][c][d]concat=n=4:v=1,scale=960:-2[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart $O/teaser.mp4
fi
du -sh $O
