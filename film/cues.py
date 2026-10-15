#!/usr/bin/env python3
"""The one cue sheet. 120 BPM, a beat is 0.5 s, a bar is 2 s. film.js and score.py both read cues.json."""
import json, os
BPM = 120; B = 60 / BPM; BAR = 4 * B
PULLS = [  # bar start, census no, state, the pull
    (16.0, 550, 1), (18.0, 523, 2), (20.0, 1467, 1), (22.0, 486, 1), (24.0, 548, 1), (25.0, 2100, 1), (26.0, 487, 5)]
C = dict(
    bpm=BPM, dur=44.0,
    in_case=0.5, emergency=1.5, blink=2.0, beacon=2.0, dolly=3.0,
    build=4.0, pyro1=4.0, silence1=7.5,
    hit1=8.0, hit2=9.0, roll=10.0, one_more=10.5, silence2=11.5,
    drop=12.0, slow_end=14.0, card_big=14.0,
    pulls=[dict(t=t, no=no, st=st) for t, no, st in PULLS],
    wide=28.0, w1=28.2, w2=29.6, w3=31.0, rearm_wide=31.0,
    back=32.0, tag=34.5, front=36.0, last_line=36.2, final=37.0, end_card=38.5,
)
C['strikes'] = [C['hit1'] - 0.38, C['hit2'] - 0.38, C['drop'] - 0.38]   # the hammer lands 0.38 s after the swing starts
json.dump(C, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cues.json'), 'w'), indent=1)
if __name__ == '__main__':
    for k, v in C.items():
        if k != 'pulls': print(f'{k:12} {v}')
    for p in C['pulls']: print('pull', p)
