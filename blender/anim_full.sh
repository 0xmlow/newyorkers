#!/bin/zsh
# full render of the hype film shots, only the frames the edit uses (film_v2.py)
cd "/Users/degens/Desktop/NEW YORKERS BY MLOW/THE GARDEN 2026-11-26"
B=/Applications/Blender.app/Contents/MacOS/Blender
while read shot a b; do
  $B -b --factory-startup --python blender/anim_shots.py -- $shot --frames $a $b --spp 20 2>&1 | grep -E "ANIM|Error|Traceback"
done <<LIST
ex_seventh 1 86
ex_aerial 20 70
ex_concourse 20 64
ex_platform 1 108
bb_track 20 52
bb_rim 6 67
bb_hero 15 84
bb_crane 1 94
bb_bowl 10 83
bb_rafters 1 72
hk_glass 1 84
hk_net 1 57
hk_wide 30 44
cn_floor 20 92
cn_stage 20 52
cn_wide 40 72
bx_orbit 1 88
bx_overhead 30 71
bx_wide 40 77
cr_ring 1 84
cr_wire 20 94
cr_wide 50 61
LIST
echo ALLDONE
