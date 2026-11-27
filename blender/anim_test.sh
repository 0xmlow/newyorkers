#!/bin/zsh
cd "/Users/degens/Desktop/NEW YORKERS BY MLOW/THE GARDEN 2026-11-26"
for s in $@; do /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python blender/anim_shots.py -- $s --test --res 960 540 --spp 16 2>&1 | grep -E "ANIM|Error|Traceback" ; done
