#!/bin/bash
# tools/shoot_clips.sh: the social clips, square 1080, each with its GIF window. Re-run after changes; work/clips/ is the output.
cd "$(dirname "$0")/.."; C="python3 _build/capture.py"; S="--w 1080 --h 1080"
$C sq_tree_lighting tree 15 $S --gs 5.5 --gl 8 --setup "at(10,-6.2,0,0.34); hint('The switch').userData.click();"
$C sq_channel channel 14 $S --gs 1 --gl 8 --setup "at(10,7.2,0,0.12); for(let i=0;i<420;i++){ __P.z=7.2-i*0.032; __P.pitch=0.12+i*0.0002; await sleep(30);}"
$C sq_rink rink 14 $S --gs 1 --gl 8 --setup "at(10,7,0,0.16); for(let i=0;i<420;i++){ __P.z=7-i*0.033; __P.x=10+Math.sin(i/70)*2.6; __P.yaw=-Math.cos(i/70)*0.18; await sleep(30);}"
$C sq_star_lift tree 30 $S --gs 18 --gl 8 --setup "at(10,1.5,0,0.3); hint('The switch').userData.click(); await sleep(14000); hint('The star lift').userData.click();"
$C sq_tiny top 14 $S --gs 1 --gl 8 --setup "window.LIGHTINGS.tree=true; hint('Step inside the model').userData.click(); await sleep(600); for(let i=0;i<320;i++){ __P.yaw=0.1-i*0.0022; __P.pitch=0.2+i*0.0003; await sleep(30);}"
$C sq_melt dyker 14 $S --gs 3 --gl 8 --setup "const p=hint('A projector'); for(let i=0;i<3;i++){p.userData.click(); await sleep(250);} at(10,-1.5,Math.PI/2*0.78,0.36);"
$C sq_windows window 24 $S --gs 6 --gl 8 --setup "const cs=__clickables.filter(m=>(m.userData.hint||'')==='A candle'); for(let p=0;p<10;p++) for(const k of cs){k.userData.click(); await sleep(30);} at(10,-6.1,0,0.14);"
$C sq_sleigh dyker 30 $S --gs 0 --gl 8 --setup "at(10,3,0,0.55); for(let i=0;i<900;i++){ __P.yaw=Math.sin(i/200)*0.9; await sleep(30);} "
$C sq_globe top 12 $S --gs 0.5 --gl 7 --setup "at(16.4,4.0,0,-0.32); await sleep(800); hint('A snow globe').userData.click();"
$C sq_blackout dyker 16 $S --gs 0 --gl 8 --setup "at(10,6.4,0,0.1); hint('Throw the main').userData.click();"
$C sq_fifth_show fifth 22 $S --gs 9 --gl 8 --setup "at(10,0,0,0.12);"
ls -la work/clips/*.gif | awk '{print $5/1048576 " MB", $9}'
