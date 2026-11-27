"""people.py: pose and dress Blender's CC0 Human Base Meshes (realistic male and female, level 0 cage) in numpy.
  python3 blender/people.py
Writes blender/work/pose_<body>_<pose>_<dress>.npz: v (posed vertices), part (0 skin, 1 top, 2 bottom, 3 shoes, 4 hair, 5 socks),
lens + flat (the faces). Rest pose: A pose, facing -y, feet at z 0. Joints were measured off the meshes by slices."""
import numpy as np, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(HERE, 'work')

J = {  # joint positions (x for the left side, +x; mirrored for the right), metres
    'male_realistic': dict(hip=(0.095, -0.01, 0.875), knee=(0.14, 0.02, 0.475), ankle=(0.168, 0.05, 0.09), sh=(0.19, 0.0, 1.405), el=(0.322, -0.02, 1.05), wr=(0.40, -0.09, 0.83), neck=1.47, crotch=0.74, H=1.684),
    'female_realistic': dict(hip=(0.09, -0.01, 0.86), knee=(0.108, 0.012, 0.47), ankle=(0.12, 0.035, 0.09), sh=(0.175, 0.005, 1.37), el=(0.285, 0.01, 1.03), wr=(0.37, -0.06, 0.81), neck=1.44, crotch=0.73, H=1.641),
}
def ss(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def rot(p, w, R, c): c = np.asarray(c); q = (p - c) @ R.T + c; return p + (q - p) * w[:, None]

def load(body):
    d = np.load(os.path.join(W, f'body_{body}.npz')); return d['v'].copy(), d['lens'], d['flat']
def adjacency(n, lens, flat):
    e = []; i = 0
    for L in lens: f = flat[i:i + L]; e += [(f[k], f[(k + 1) % L]) for k in range(L)]; i += L
    e = np.array(e); return np.concatenate([e, e[:, ::-1]])
def normals(v, lens, flat):
    nrm = np.zeros_like(v); i = 0
    tri = []
    for L in lens: f = flat[i:i + L]; tri += [(f[0], f[k], f[k + 1]) for k in range(1, L - 1)]; i += L
    t = np.array(tri); fn = np.cross(v[t[:, 1]] - v[t[:, 0]], v[t[:, 2]] - v[t[:, 0]])
    for k in range(3): np.add.at(nrm, t[:, k], fn)
    return nrm / (np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9)
def smooth(v, E, mask, it):
    deg = np.bincount(E[:, 0], minlength=len(v)).astype(float)[:, None]
    for _ in range(it):
        s = np.zeros_like(v); np.add.at(s, E[:, 0], v[E[:, 1]]); avg = s / np.maximum(deg, 1)
        v = v + (avg - v) * (0.5 * mask[:, None])
    return v

def regions(v, j):
    x, y, z = v[:, 0], v[:, 1], v[:, 2]; ax = np.abs(x)
    S, Wr = np.array(j['sh'])[[0, 2]], np.array(j['wr'])[[0, 2]]; d = (Wr - S) / np.linalg.norm(Wr - S); n = np.array([-d[1], d[0]])  # n points down and in
    P = np.stack([ax, z], 1) - S; t = P @ d / np.linalg.norm(Wr - S); off = P @ n
    arm = (t > 0.04) & (off > np.where(t > 0.15, -0.07, -0.055)) & (z < j['sh'][2] + 0.06) & (z > 0.55)
    arm |= (t > 0.55) & (np.hypot(*(P - np.outer(t * np.linalg.norm(Wr - S), d)).T) < 0.13) & (z > 0.55)
    E = np.array(j['el'])[[0, 2]]; te = (np.stack([ax, z], 1) - E) @ d
    return dict(arm=arm, t=t, te=te, leg=(~arm) & (z < j['hip'][2] + 0.02))

POSES = {
    # name: hip, knee (per side, radians about x; negative swings the leg forward), shoulder (about y in, about x fwd), elbow (about x), lean, neck yaw
    'sit':       dict(hip=(-1.57, -1.57), knee=(1.57, 1.57), shy=(0.36, 0.36), shx=(-0.3, -0.3), el=(-0.95, -0.95), lean=0.06),
    'sit_hands': dict(hip=(-1.5, -1.6), knee=(1.45, 1.65), shy=(0.32, 0.36), shx=(-0.5, -0.2), el=(-0.85, -1.05), lean=0.12),
    'sit_phone': dict(hip=(-1.57, -1.57), knee=(1.6, 1.5), shy=(0.38, 0.30), shx=(-0.25, -0.55), el=(-1.1, -2.2), lean=0.14, head=0.25),
    'sit_cheer': dict(hip=(-1.55, -1.55), knee=(1.55, 1.6), shy=(0.36, -0.15), shx=(-0.35, -2.9), el=(-1.2, -0.25), lean=0.0),
    'sit_lean':  dict(hip=(-1.65, -1.65), knee=(1.85, 1.75), shy=(0.3, 0.3), shx=(-0.9, -0.85), el=(-1.4, -1.4), lean=0.45),
    'stand':     dict(hip=(0.0, 0.05), knee=(0.05, 0.08), shy=(0.3, 0.32), shx=(0.05, -0.1), el=(-0.2, -0.35), lean=0.02),
    'stand_cheer': dict(hip=(0.0, 0.0), knee=(0.0, 0.0), shy=(-0.2, -0.2), shx=(-2.9, -2.8), el=(-0.3, -0.4), lean=-0.05),
    # the players
    'ready':     dict(hip=(-0.6, -0.35), knee=(1.0, 0.75), shy=(0.1, 0.0), shx=(-0.95, -0.6), el=(-0.8, -1.0), lean=0.36, twist=0.1),
    'run':       dict(hip=(-0.95, 0.5), knee=(0.6, 1.6), shy=(0.25, 0.3), shx=(0.75, -0.95), el=(-1.45, -1.65), lean=0.26, twist=0.14),
    'run2':      dict(hip=(0.5, -0.9), knee=(1.55, 0.5), shy=(0.25, 0.3), shx=(-0.95, 0.7), el=(-1.6, -1.35), lean=0.24, twist=-0.14),
    'shoot':     dict(hip=(-0.05, -0.32), knee=(0.1, 0.55), shy=(0.35, -0.25), shx=(-2.35, -2.95), el=(-1.7, -0.35), lean=-0.08, ankle=0.7, twist=0.18),
    'defend':    dict(hip=(-0.75, -0.55), knee=(1.25, 1.0), shy=(-0.4, -1.1), shx=(-0.9, -2.3), el=(-0.5, -0.2), lean=0.38, twist=-0.15),
    'gather':    dict(hip=(-0.75, -0.2), knee=(1.15, 0.55), shy=(0.15, -0.15), shx=(-1.0, -1.15), el=(-1.2, -1.1), lean=0.42, twist=0.12),
    'contest':   dict(hip=(-0.1, -0.35), knee=(0.2, 0.6), shy=(0.25, -0.1), shx=(-0.4, -2.95), el=(-0.5, -0.1), lean=0.05, twist=-0.1, ankle=0.5),
    'closeout':  dict(hip=(-0.45, 0.25), knee=(0.85, 0.65), shy=(0.0, -0.2), shx=(-0.3, -2.4), el=(-0.6, -0.15), lean=0.3, twist=0.08),
    'boxout':    dict(hip=(-0.8, -0.65), knee=(1.3, 1.1), shy=(-0.95, -0.95), shx=(-0.3, -0.3), el=(-1.0, -1.0), lean=0.5),
    'cut':       dict(hip=(-1.05, 0.6), knee=(0.7, 1.75), shy=(0.2, 0.25), shx=(0.9, -1.1), el=(-1.5, -1.6), lean=0.34, twist=0.2),
    'rebound':   dict(hip=(-0.15, -0.3), knee=(0.3, 0.55), shy=(0.1, -0.1), shx=(-2.85, -2.75), el=(-0.25, -0.3), lean=-0.02, ankle=0.6),
    # hockey (2026-11-27): low on the skates, the stick hands low and in front
    'skate':     dict(hip=(-0.95, 0.4), knee=(1.35, 0.3), shy=(0.25, 0.4), shx=(-0.42, -0.25), el=(-0.9, -1.2), lean=0.5, twist=0.22),
    'skate2':    dict(hip=(0.4, -0.95), knee=(0.3, 1.35), shy=(0.4, 0.25), shx=(-0.25, -0.45), el=(-1.2, -0.9), lean=0.5, twist=-0.22),
    'hready':    dict(hip=(-0.62, -0.55), knee=(0.95, 0.9), shy=(0.3, 0.35), shx=(-0.45, -0.3), el=(-0.8, -1.1), lean=0.44, twist=0.1),
    # boxing: the guard (fists at the chin) and the jab (the lead hand out at shoulder height)
    'guard':     dict(hip=(-0.3, 0.12), knee=(0.42, 0.32), shy=(0.5, 0.5), shx=(-0.8, -0.65), el=(-2.15, -2.25), lean=0.16, twist=0.3),
    'jab':       dict(hip=(-0.35, 0.15), knee=(0.5, 0.35), shy=(0.12, 0.5), shx=(-1.5, -0.65), el=(-0.12, -2.2), lean=0.22, twist=0.4),
    'dribble':   dict(hip=(-0.55, 0.15), knee=(0.85, 0.7), shy=(0.25, 0.15), shx=(-0.6, -0.55), el=(-0.6, -0.9), lean=0.35),
}

def pose(v, j, R, P):
    v = v.copy(); x, z = v[:, 0], v[:, 2]
    for side, sgn in ((0, 1), (1, -1)):
        sel = (np.sign(x) == sgn) | (np.abs(x) < 1e-6)
        H, K = np.array(j['hip']) * [sgn, 1, 1], np.array(j['knee']) * [sgn, 1, 1]
        Sh, El = np.array(j['sh']) * [sgn, 1, 1], np.array(j['el']) * [sgn, 1, 1]
        # the leg: the knee first (in rest space), then the hip; the crotch blends into the pelvis
        wl = R['leg'] * sel * ss(j['hip'][2] - 0.02, j['crotch'] - 0.02, z) * np.clip(np.abs(x) / 0.05, 0, 1)
        wk = R['leg'] * sel * ss(K[2] + 0.04, K[2] - 0.04, z)
        v = rot(v, wk, rx(P['knee'][side]), K); v = rot(v, wl, rx(P['hip'][side]), H)
        if 'ankle' in P: v = rot(v, R['leg'] * sel * ss(0.1, 0.06, z), rx(P['ankle']), np.array(j['ankle']) * [sgn, 1, 1])
        # the arm: elbow first, then the shoulder (in toward the body about y, then forward about x)
        wa = R['arm'] * sel * ss(0.0, 0.1, R['t']); we = R['arm'] * sel * ss(-0.03, 0.04, R['te'])
        v = rot(v, we, rx(P['el'][side]), El); v = rot(v, wa, rx(P['shx'][side]) @ ry(sgn * P['shy'][side]), Sh)
    # the torso leans from the waist, arms and head with it; the head turns a little
    wt = np.where(R['arm'], 1.0, ss(0.92, 1.12, z))
    if P.get('twist'): v = rot(v, wt, rz(P['twist']), (0, 0, 0.98))
    v = rot(v, wt, rx(-P['lean']), (0, 0, 0.98))
    if P.get('head'): v = rot(v, ss(j['neck'] - 0.03, j['neck'] + 0.05, z) * (~R['arm']), rx(-P['head']), (0, 0, j['neck']))
    return v

DRESS = {  # sleeves: 'long' covers to the wrist, 'short' to mid upper arm, 'none' a vest; legs: 'long' or 'shorts'
    'winter': dict(sleeve='long', legs='long', smooth_top=30, push=0.016),
    'tee': dict(sleeve='short', legs='long', smooth_top=12, push=0.008),
    'jersey': dict(sleeve='none', legs='shorts', smooth_top=14, push=0.02),
    'hockey': dict(sleeve='long', legs='shorts', smooth_top=24, push=0.03),
    'suit': dict(sleeve='long', legs='long', smooth_top=24, push=0.012),
}
def dress(v, j, R, D):
    z = v[:, 2]; n = len(v); part = np.zeros(n, int)
    torso = (~R['arm']) & (z > j['crotch'] - 0.04) & (z < j['neck'] - 0.02)
    if D['sleeve'] == 'none': torso &= ~((np.abs(v[:, 0]) > j['sh'][0] - 0.035) & (z > j['sh'][2] - 0.17))   # the arm holes
    if D['sleeve'] == 'none': torso &= ~((z > j['sh'][2] - 0.1 + np.abs(v[:, 0]) * 0.9) & (np.abs(v[:, 0]) < 0.11))   # a scooped neck, front and back
    sleeve = R['arm'] & (R['t'] < {'long': 0.9, 'short': 0.28, 'none': -1}[D['sleeve']])
    part[torso | sleeve] = 1
    legs = R['leg'] & (z < j['crotch'] + 0.02); lo = 0.09 if D['legs'] == 'long' else j['knee'][2] + 0.06
    part[legs & (z >= lo)] = 2; part[(z < j['crotch'] + 0.06) & (z > j['crotch'] - 0.1) & ~R['arm']] = 2
    part[z < 0.095] = 3
    if D['legs'] == 'shorts': part[R['leg'] & (z >= 0.095) & (z < 0.21)] = 5   # socks
    if D['sleeve'] == 'none':
        # bindings: jersey verts next to bare skin are the collar and armhole trim; the shorts' hems and outer side stripe
        E_ = D['_E']; top = part == 1; nb = np.zeros(n, bool); np.logical_or.at(nb, E_[:, 0], (part[E_[:, 1]] == 0)); part[top & nb] = 7
        bot = part == 2; nb2 = np.zeros(n, bool); np.logical_or.at(nb2, E_[:, 0], (part[E_[:, 1]] == 0)); part[bot & nb2] = 8
        lx = np.abs(j['knee'][0]) ; part[bot & (np.abs(v[:, 0]) > np.abs(j['hip'][0]) + 0.075) & (v[:, 1] > -0.03) & (v[:, 1] < 0.04)] = 8
    part[(part == 3) & (z < 0.016)] = 9
    head = z > j['neck'] + 0.07; hair = head & ((v[:, 1] > -0.02) | (z > j['H'] - 0.07))
    part[hair] = 4
    return part

def bake():
    out = []
    plan = [('sit', 'winter'), ('sit', 'tee'), ('sit_hands', 'winter'), ('sit_phone', 'winter'), ('sit_cheer', 'tee'), ('sit_lean', 'winter'), ('sit_hands', 'tee'), ('sit_cheer', 'winter'),
            ('stand', 'suit'), ('stand_cheer', 'winter'), ('sit', 'suit'),
            ('ready', 'jersey'), ('gather', 'jersey'), ('contest', 'jersey'), ('closeout', 'jersey'), ('boxout', 'jersey'), ('cut', 'jersey'), ('rebound', 'jersey'), ('run', 'jersey'), ('run2', 'jersey'), ('shoot', 'jersey'), ('defend', 'jersey'), ('dribble', 'jersey'), ('stand', 'jersey'), ('sit', 'jersey'),
            ('skate', 'hockey'), ('skate2', 'hockey'), ('hready', 'hockey'), ('guard', 'jersey'), ('jab', 'jersey')]
    for body in ('male_realistic', 'female_realistic'):
        v0, lens, flat = load(body); j = J[body]; R = regions(v0, j); E = adjacency(len(v0), lens, flat)
        for pname, dname in plan:
            if body == 'female_realistic' and dname in ('jersey', 'hockey'): continue
            D = dict(DRESS[dname], _E=E); part = dress(v0, j, R, D)
            # clothes: smooth the anatomy away in the rest pose, then push out by the cloth's thickness
            v = v0.copy(); cl = (part == 1) | (part == 2); v = smooth(v, E, (part == 1).astype(float), D['smooth_top']); v = smooth(v, E, (part == 2).astype(float), 8)
            v = smooth(v, E, (part == 3).astype(float), 20)
            nr = normals(v, lens, flat); v = v + nr * (cl * D['push'] + (part == 7) * (D['push'] + 0.008) + (part == 8) * (D['push'] + 0.004) + (part == 3) * 0.016 + (part == 9) * 0.02 + (part == 5) * 0.004 + (part == 4) * 0.006)[:, None]
            # the head comes off: a NEW YORKERS flower head goes on in Blender at the neck, so keep where the neck went
            neck = (np.abs(v0[:, 2] - (j['neck'] + 0.0)) < 0.025) & ~R['arm']
            v = pose(v, j, R, POSES[pname]); neck_p = v[neck].mean(0)
            cut = v0[:, 2] > j['neck'] + 0.035; keep_f = []; i0 = 0; nl, nf = [], []
            for L in lens:
                f = flat[i0:i0 + L]; i0 += L
                if not cut[f].any(): nl.append(L); nf.extend(f)
            lens_o, flat_o = np.array(nl), np.array(nf)
            if pname.startswith('sit'): v[:, 2] -= 0.0      # seat at the origin height is set in Blender
            else: dz = v[:, 2].min(); v[:, 2] -= dz; neck_p = neck_p - [0, 0, dz]
            name = f'pose_{body[0]}_{pname}_{dname}'; np.savez(os.path.join(W, name + '.npz'), v=v.astype(np.float32), rest=v0.astype(np.float32), part=part.astype(np.int8), lens=lens_o, flat=flat_o, neck=neck_p.astype(np.float32) - [0, 0, 0 if not pname.startswith('sit') else 0]); out.append(name)
    print(len(out), 'poses'); return out

if __name__ == '__main__': bake()
