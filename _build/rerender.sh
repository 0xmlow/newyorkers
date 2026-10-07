#!/bin/bash
# Re-render every deliverable after an engine or typography change. Needs headless Chrome on :9333 and the site on :4207.
set -e; cd "$(dirname "$0")"
VC="/Users/degens/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/782bdcfa-efbb-4f97-ac74-d97c73bc6dee/ab1a3ffb-cac2-4835-b4f4-489a319b8167/skills/mlow-video-cuts/scripts/variants.py"
echo "== stills"; python3 -u shots.py
echo "== film"; python3 -u film.py; python3 -u film.py --mux ../DELIVERABLES/film/audio/lyria_a.mp3
echo "== hype"; python3 -u hype.py; rm -f ../DELIVERABLES/film/meme_island_film_video.mp4
rm -rf ../DELIVERABLES/hype/cuts; (cd ../DELIVERABLES/hype && python3 "$VC" meme_island_hype.mp4 --piece meme_island_hype --outdir cuts > /dev/null)
echo "== glb"; python3 -u export_glb.py
echo "== done"; df -h ~ | tail -1
