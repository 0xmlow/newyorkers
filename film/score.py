#!/usr/bin/env python3
"""score.py: the BREAK GLASS score and sound design, synthesised, on the cue sheet.

120 BPM, A minor. Every hit is placed at the frame its picture happens (read from the render log when there
is one), with its peak on the first sample: attacks of 1 ms or less, cosine phase. Writes score_raw.wav
(stereo, 48 kHz); master.py levels it to -14 LUFS.
    python3 score.py [render.log.json]
"""
import sys, os, json
import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'cues.json')))
SR = 48000; DUR = C['dur'] + 0.5; N = int(SR * DUR)
B = 60 / C['bpm']; BAR = 4 * B
rng = np.random.default_rng(1015)
L = np.zeros(N); R = np.zeros(N)

# measured impact frames from the render, when we have them
hits = {'hit1': C['hit1'], 'hit2': C['hit2'], 'drop': C['drop']}
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    log = json.load(open(sys.argv[1])); prev = (0, 'armed'); seen = []
    for f, s in log:
        d = json.loads(s); k = (d['hits'], d['state'])
        if k != prev and (k[0] > prev[0] or k[1] == 'broken' and prev[1] != 'broken'): seen.append(f / 30)
        prev = k
    if len(seen) >= 3: hits.update(hit1=seen[0], hit2=seen[1], drop=seen[2])
    print('impacts from the render:', [round(x, 3) for x in seen])
SMASH = [p['t'] for p in C['pulls']]; FINAL = C['final']

def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def t_(d): return np.arange(int(SR * d)) / SR
def put(x, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR));
    if i >= N: return
    x = x[: N - i] * g; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * l * 1.414; R[i:i + len(x)] += x * r * 1.414
def db(v): return 10 ** (v / 20)
def silence(a, b):   # hard cut everything in [a, b) with 5 ms ramps: the beat of nothing before a payoff
    i, j, r = int(a * SR), int(b * SR), int(0.005 * SR)
    env = np.ones(N); env[i:j] = 0; env[i - r:i] = np.linspace(1, 0, r); env[j:j + r] = np.minimum(env[j:j + r], np.linspace(0, 1, r))
    return env

# ---------------- instruments ----------------
def kick(g=1.0, body=0.32):
    t = t_(0.45); f = 48 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.cos(ph) * np.exp(-t / body)
    x += 0.8 * np.cos(2 * np.pi * 190 * t) * np.exp(-t / 0.03)           # the knock phones can hear
    x[:int(0.003 * SR)] += rng.uniform(-1, 1, int(0.003 * SR)) * 0.4
    return x * g
def clap(g=1.0):
    x = np.zeros(int(0.3 * SR))
    for k, d in enumerate([0, 0.011, 0.022]):
        n = rng.uniform(-1, 1, int(0.2 * SR)) * np.exp(-t_(0.2) / (0.012 if k < 2 else 0.09)); i = int(d * SR); x[i:i + len(n)] += n
    return bp(x, 900, 3200) * 2.2 * g
def hat(open_=False, g=1.0):
    d = 0.22 if open_ else 0.05; n = rng.uniform(-1, 1, int(d * SR)) * np.exp(-t_(d) / (d / 3))
    return hp(n, 7500, 4) * g
def saw(f, d, det=0.0):
    t = t_(d); x = 2 * ((t * f) % 1) - 1
    if det: x = 0.5 * x + 0.5 * (2 * ((t * f * (1 + det)) % 1) - 1)
    return x
def bass(f, d=0.24, g=1.0):
    t = t_(d); x = saw(f, d) * 0.7 + np.sin(2 * np.pi * f * t) * 0.6 + saw(2 * f, d) * 0.25     # an octave up for phones
    env = np.minimum(1, t / 0.002) * np.exp(-t / 0.16)
    return lp(x * env, 900) * g
def stab(fs, d=0.16, g=1.0):
    t = t_(d); x = sum(saw(f, d, 0.006) + saw(f * 2, d, -0.004) * 0.4 for f in fs)
    return lp(x * np.minimum(1, t / 0.002) * np.exp(-t / 0.07), 2600) * g / len(fs)
def pad(fs, d, g=1.0, cut=900):
    t = t_(d); x = sum(saw(f, d, 0.004) + saw(f, d, -0.005) for f in fs)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.5)
    return lp(x * env, cut) * g / len(fs)
def bell(d=0.8, g=1.0, trem=0.0, f0=880):
    t = t_(d); x = sum(a * np.cos(2 * np.pi * f0 * r * t) * np.exp(-t / (d * w)) for r, a, w in [(1, 1, .5), (2.76, .5, .3), (5.4, .25, .2), (1.5, .3, .4)])
    if trem: x *= 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * trem * t))
    return x * g
def tinkles(n, spread, g=1.0):
    x = np.zeros(int((spread + 0.3) * SR))
    for _ in range(n):
        f = rng.uniform(2600, 9000); d = rng.uniform(0.04, 0.2); s = np.cos(2 * np.pi * f * t_(d)) * np.exp(-t_(d) / (d / 4))
        i = int(spread * rng.random() ** 1.7 * SR); x[i:i + len(s)] += s * rng.uniform(0.3, 1)
    return x * g / 4
def crack(g=1.0):
    n = rng.uniform(-1, 1, int(0.25 * SR)) * np.exp(-t_(0.25) / 0.03)
    x = hp(n, 1800) * 1.4 + np.cos(2 * np.pi * 85 * t_(0.25)) * np.exp(-t_(0.25) / 0.07) * 0.9
    tk = tinkles(10, 0.15, 0.8); x = np.pad(x, (0, max(0, len(tk) - len(x)))); x[:len(tk)] += tk
    return x * g
def shatter(g=1.0, big=False):
    d = 1.6 if big else 1.0
    n = rng.uniform(-1, 1, int(d * SR)) * np.exp(-t_(d) / (0.35 if big else 0.2))
    x = bp(n, 1500, 9000) * 1.2 + hp(n, 5000) * 0.6
    tk = tinkles(70 if big else 40, 1.3 if big else 0.8, 1.2); x[:len(tk)] += tk[:len(x)]
    t = t_(d); f = 32 + 40 * np.exp(-t * 6); boom = np.cos(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.7 if big else 0.35))
    return (x + boom * (1.3 if big else 0.8)) * g
def whoosh(d=0.5, up=True, g=1.0):
    t = t_(d); n = rng.uniform(-1, 1, len(t)); fc = np.linspace(400, 5000, len(t)) if up else np.linspace(5000, 400, len(t))
    out = np.zeros(len(t)); seg = int(SR * 0.02)
    for i in range(0, len(t), seg):
        f = fc[i]; out[i:i + seg] = bp(n[i:i + seg + 400], f * 0.7, min(f * 1.4, 20000))[:len(out[i:i + seg])]
    env = np.sin(np.pi * t / d) ** 2 if not up else (t / d) ** 2
    return out * env * g
def rewind(d, g=1.0):
    x = tinkles(30, d * 0.8, 1.0)[::-1]; w = whoosh(d, True, 1.0)
    m = max(len(x), len(w)); x = np.pad(x, (m - len(x), 0)); w = np.pad(w, (m - len(w), 0))
    return (x * 0.8 + w) * g
def roar(d, g=1.0):
    t = t_(d); w = np.cumsum(rng.uniform(-1, 1, len(t))); w -= np.convolve(w, np.ones(2001) / 2001, 'same'); w /= np.abs(w).max() + 1e-9
    flick = 0.75 + 0.25 * np.sin(2 * np.pi * 7 * t) * np.sin(2 * np.pi * 3.1 * t)
    cr = np.zeros(len(t)); idx = rng.integers(0, len(t), int(d * 40)); cr[idx] = rng.uniform(-1, 1, len(idx))
    x = lp(w, 1100) * flick * 1.5 + hp(lp(cr, 6000), 1500) * 1.2
    env = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.4)
    return x * env * g
def siren(d, f1=660, f2=880, rate=B, g=1.0):
    t = t_(d); f = np.where((t // rate) % 2 == 0, f1, f2).astype(float); f = lp(f, 30, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) + 0.3 * np.sin(3 * ph)
    return x * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05) * g
def riser(d, g=1.0, f0=200, f1=1800):
    t = t_(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * saw(1, d) * 0) * (t / d) ** 1.6 + whoosh(d, True, 0.6)[:len(t)]
    return x * g
def tick(g=1.0): return np.cos(2 * np.pi * 2400 * t_(0.04)) * np.exp(-t_(0.04) / 0.006) * g
def thump(g=1.0): return np.cos(2 * np.pi * np.cumsum(60 + 80 * np.exp(-t_(0.3) * 30)) / SR) * np.exp(-t_(0.3) / 0.12) * g

# ---------------- arrangement ----------------
A1, C2, D2, E2, F1, G1 = 55.0, 65.41, 73.42, 82.41, 43.65, 49.0
PROG = [(A1, [220, 261.6, 329.6]), (F1, [174.6, 220, 261.6]), (C2, [261.6, 329.6, 392]), (G1, [196, 246.9, 293.7])]
def bar_of(t): return int(t // BAR)

# intro 0 to 4: a heartbeat under a low drone
put(pad([A1 * 2, E2 * 2, A1 * 4], 4.2, 0.22, 600), 0.0)
for b in range(8):
    tb = b * B
    put(kick(0.45, 0.2), tb); put(kick(0.28, 0.15), tb + 0.17)
put(bell(1.2, 0.5, trem=17), C['emergency'])
put(siren(0.9, 1200, 1500, 0.12, 0.08), C['beacon'], pan=0.3)
put(whoosh(0.5, True, 0.5), C['dolly'] - 0.5)
for tt in [C['blink'], C['blink'] + 0.08]: put(tick(0.25), tt)

# build 4 to 7.5: four on the floor, sirens, a bass pulse; one beat of nothing at 7.5
for i in range(int((C['silence1'] - C['build']) / B)):
    tb = C['build'] + i * B
    put(kick(0.9), tb)
    if i % 2: put(clap(0.55), tb)
    for h in range(2): put(hat(False, 0.22), tb + h * B / 2 + B / 4)
    put(bass(A1, 0.22, 0.55), tb + B / 2); put(bass(A1, 0.22, 0.4), tb)
put(siren(C['silence1'] - C['build'], 587, 784, B, 0.11), C['build'], pan=-0.2)
for k, tt in enumerate([C['build'], C['build'] + 1, C['build'] + 2]): put(tick(0.4), tt)
put(roar(1.7, 0.7), C['pyro1'], pan=-0.5); put(roar(1.7, 0.7), C['pyro1'], pan=0.5)
put(pad([A1 * 4, C2 * 2, E2 * 2], 3.6, 0.16, 1400), C['build'])

# hits 8 to 11.5
for nm in ['hit1', 'hit2']:
    put(crack(1.0), hits[nm]); put(thump(0.9), hits[nm]); put(kick(1.0, 0.4), hits[nm])
for i in range(4):   # toms between the hits
    put(kick(0.55, 0.12), hits['hit1'] + 0.5 + i * 0.25 if i < 2 else hits['hit2'] + 0.25 * (i - 1))
roll_t = C['roll']; k = 0; tt = roll_t
while tt < C['silence2'] - 0.02:
    step = B / 2 if tt < roll_t + 0.5 else (B / 4 if tt < roll_t + 1.0 else B / 8)
    put(clap(0.25 + 0.5 * (tt - roll_t) / 1.5), tt); tt += step
put(riser(C['silence2'] - roll_t, 0.35, 220, 1600), roll_t)
put(siren(C['silence2'] - roll_t, 700, 940, B / 2, 0.06), roll_t, pan=0.2)
put(thump(0.8), C['one_more'])
hold = silence(C['silence1'], C['hit1']) * silence(C['silence2'], hits['drop'])
L *= hold; R *= hold

# the drop: the loudest moment in the film
put(shatter(1.6, big=True), hits['drop']); put(kick(1.3, 0.6), hits['drop'])
put(bell(2.4, 0.6, trem=17), hits['drop'] + 0.05)
put(pad([110, 130.8, 164.8, 220], 2.2, 0.35, 1800), hits['drop'])
put(roar(4.6, 0.9), hits['drop'] + 0.02, pan=-0.6); put(roar(4.6, 0.9), hits['drop'] + 0.02, pan=0.6)
for i in range(4):   # half time under the slow motion
    put(kick(0.7, 0.5), hits['drop'] + i * BAR / 2 + (BAR / 2 if i == 0 else 0) * 0)

# the groove 14 to 28 and 28 to 32 (bigger), the pulls on every downbeat
def groove(t0, t1, big=False):
    i = 0
    while t0 + i * B < t1 - 1e-6:
        tb = t0 + i * B; root, ch = PROG[bar_of(tb - 14.0) % 4]
        put(kick(1.0), tb)
        if i % 2: put(clap(0.6), tb)
        put(hat(False, 0.25), tb + B / 2); put(hat(i % 4 == 3, 0.16), tb + B / 4); put(hat(False, 0.12), tb + 3 * B / 4)
        put(bass(root, 0.2, 0.7), tb + B / 2); put(bass(root * 2, 0.12, 0.35), tb + 3 * B / 4)
        put(stab(ch, 0.14, 0.32 if big else 0.22), tb + B / 2, pan=0.25 * (1 if i % 2 else -1))
        i += 1
groove(C['slow_end'], C['wide'])
groove(C['wide'], C['back'], big=True)
for b in range(int((C['back'] - C['wide']) / BAR)):
    root, ch = PROG[b % 4]; put(pad([f * 2 for f in ch], BAR + 0.1, 0.22, 2400), C['wide'] + b * BAR)
for i, p in enumerate(C['pulls']):
    prev = C['pulls'][i - 1]['t'] if i else hits['drop']; lead = 0.5 if p['t'] - prev >= 2 else 0.42
    put(rewind(lead, 0.55), p['t'] - lead)
    boot = i == len(C['pulls']) - 1
    put(shatter(1.25 if boot else 0.95, big=boot), p['t']); put(kick(1.1, 0.45), p['t'])
    put(bell(1.6 if boot else 0.5, 0.45, trem=17), p['t'] + 0.04)
    put(roar(2.4 if not boot else 3.8, 0.55), p['t'] + 0.02, pan=-0.6); put(roar(2.4 if not boot else 3.8, 0.55), p['t'] + 0.02, pan=0.6)
    put(tick(0.35), p['t'] + 0.12)
put(roar(2.8, 0.6), C['wide'], pan=-0.6); put(roar(2.8, 0.6), C['wide'], pan=0.6)
for tt in [C['w1'], C['w2'], C['w3']]: put(thump(0.6), tt)

# the back 32 to 36: drums out, a music box of the bell, the riser home
put(whoosh(1.2, False, 0.45), C['back'] - 0.1)
put(pad([110, 130.8, 164.8], 4.2, 0.3, 1200), C['back'])
for i, f in enumerate([880, 1046.5, 1318.5, 1046.5, 880, 1318.5, 1760, 1318.5]):
    put(bell(0.6, 0.28, f0=f), C['back'] + 0.5 + i * B)
put(riser(1.5, 0.3, 160, 1400), C['front'] - 1.5)

# the end 36 to 44
groove(C['front'], C['final'])
put(thump(0.8), C['last_line'])
put(shatter(1.7, big=True), FINAL); put(kick(1.4, 0.7), FINAL); put(bell(3.0, 0.6, trem=17), FINAL + 0.05)
put(roar(4.4, 0.9), FINAL + 0.02, pan=-0.6); put(roar(4.4, 0.9), FINAL + 0.02, pan=0.6)
groove(FINAL, C['end_card'])
put(pad([110, 164.8, 220, 261.6, 329.6], C['dur'] - C['end_card'] + 0.4, 0.4, 2200), C['end_card'])
put(bell(4.5, 0.4, f0=440), C['end_card']); put(kick(0.9, 0.9), C['end_card'])

# ---------------- out ----------------
# phones play almost nothing under 150 Hz: take the sub down, lift the presence band
def eq(ch):
    ch = hp(ch, 32, 2); low = lp(ch, 95, 2); pres = bp(ch, 1400, 5200, 2)
    return ch - 0.6 * low + 0.55 * pres
L, R = eq(L), eq(R)
x = np.stack([L, R], 1); x -= x.mean(0)
end = int(C['dur'] * SR); fade = int(1.2 * SR); x[end - fade:end] *= np.linspace(1, 0, fade)[:, None]; x[end:] = 0
x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.6) / np.tanh(1.6) * 0.9
import wave
out = os.path.join(HERE, 'score_raw.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x[:end] * 32767).astype('<i2').tobytes())
json.dump({'hits': hits, 'smash': SMASH, 'final': FINAL}, open(os.path.join(HERE, 'sync_events.json'), 'w'))
print('wrote', out, round(end / SR, 2), 's')
