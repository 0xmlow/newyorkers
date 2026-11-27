"""anim_shots.py: moving shots of THE GARDEN for the hype film. Opens the saved night (work/garden_<setup>.blend,
written by build_garden.py), keys a camera along a path, moves what moves (ball, puck, beams, walker, flashes)
and renders a frame sequence to renders/anim/<shot>/f_####.png.
  Blender -b --factory-startup --python blender/anim_shots.py -- <shot> [--test] [--spp N] [--res W H] [--frames a b]
The generator stays the source of truth: nothing here is saved back to the .blend."""
import bpy, math, os, sys, random
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(HERE, 'work'); OUT = os.path.join(HERE, 'renders', 'anim')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SHOT = argv[0]
def opt(k, n=1, cast=float, default=None):
    if k not in argv: return default
    i = argv.index(k); v = [cast(x) for x in argv[i + 1:i + 1 + n]]; return v[0] if n == 1 else v
TEST = '--test' in argv
SPP = opt('--spp', cast=int, default=40)
RES = opt('--res', 2, int, [1920, 1080])
FPS = 24

def ease(u, kind='io'):
    u = min(max(u, 0.0), 1.0)
    if kind == 'lin': return u
    if kind == 'out': return 1 - (1 - u) ** 3
    if kind == 'in': return u ** 3
    return 0.5 - 0.5 * math.cos(math.pi * u)   # sine in-out, gentle at both ends
def lerp(a, b, u): return Vector(a).lerp(Vector(b), u)
def orbit(c, r, a0, a1, z, tz, lens):
    """a camera path around centre c at radius r from angle a0 to a1 (degrees), looking at (c, tz)"""
    def f(u):
        a = math.radians(a0 + (a1 - a0) * u); rr = r(u) if callable(r) else r; return (c[0] + rr * math.cos(a), c[1] + rr * math.sin(a), z if not callable(z) else z(u)), (c[0], c[1], tz if not callable(tz) else tz(u)), lens if not callable(lens) else lens(u)
    return f
def move(l0, t0, l1, t1, lens0, lens1=None):
    def f(u): return lerp(l0, l1, u), lerp(t0, t1, u), lens0 + ((lens1 or lens0) - lens0) * u
    return f

# ---------------- the shot list: setup, frames, camera path(u), ease, focus point, f-stop, movers
SHOTS = {
    # outside: the exterior blend (exterior_test.py with EXT_SAVE=1), ZS = -13.72 is the Seventh Avenue sidewalk
    'ex_aerial':   dict(setup='exterior', n=108, cam=move((150.0, -146.0, 48.0), (0.0, 4.0, -5.0), (118.0, -118.0, 30.0), (0.0, 4.0, -4.0), 40, 34), ease='io'),
    'ex_seventh':  dict(setup='exterior', n=96, cam=move((200.0, -4.0, -12.07), (160.0, 3.0, -5.5), (186.0, -2.0, -12.07), (150.0, 2.0, -4.5), 28), ease='lin'),
    'ex_concourse': dict(setup='exterior', n=84, cam=move((46.0, 2.3, -17.07), (20.0, -0.6, -15.8), (38.0, 1.6, -17.07), (14.0, -0.6, -15.6), 28), ease='lin'),
    'ex_platform': dict(setup='exterior', n=108, cam=move((-32.0, 31.2, -25.07), (40.0, 33.8, -25.3), (-30.5, 30.6, -25.07), (40.0, 33.8, -25.3), 28), ease='lin', movers=['train']),
    # game night
    'bb_rafters':  dict(setup='basketball', n=72, cam=move((-5.0, 4.5, 1.6), (-36, -2, 21), (-8.0, 3.8, 3.2), (-36, -2, 24), 20, 22), ease='io'),
    'bb_rim':      dict(setup='basketball', n=72, cam=move((15.2, -3.4, 4.9), (8.0, 2.6, 1.2), (13.4, -1.6, 4.2), (8.0, 2.6, 1.0), 20, 22), ease='io', movers=['shot']),
    'bb_track':    dict(setup='basketball', n=84, cam=move((-6.0, -8.7, 1.25), (8, 3.0, 2.1), (3.0, -8.7, 1.25), (11, 3.0, 2.1), 40), ease='lin', focus=(6.6, 3.6, 2.2), f=5.6, movers=['shot', 'flash']),
    'bb_hero':     dict(setup='basketball', n=84, cam=orbit((6.6, 3.6), 11.5, -12, 14, 1.1, 1.8, 60), ease='lin', focus=(6.6, 3.6, 1.9), f=6.3, movers=['shot']),
    'bb_crane':    dict(setup='basketball', n=96, cam=move((-4, -26, 31), (2, 0, 0), (-22, -38.5, 18.5), (5, 1, 1.0), 24, 30), ease='io', movers=['flash']),
    'bb_bowl':     dict(setup='basketball', n=84, cam=orbit((0, 0), 46, 175, 205, 12.5, 7.0, 26), ease='lin', movers=['flash']),
    # hockey
    'hk_glass':    dict(setup='hockey', n=84, cam=move((10.0, -12.4, 1.2), (18.5, 2.0, 0.9), (16.0, -12.4, 1.2), (22.5, 2.0, 0.9), 35), ease='lin', focus=(21.0, 2.5, 0.9), f=5.6, movers=['puck']),
    'hk_net':      dict(setup='hockey', n=72, cam=move((28.2, 2.2, 0.35), (20.5, 3.6, 0.85), (27.6, 0.4, 0.5), (20.5, 3.6, 0.85), 26, 30), ease='io', movers=['puck']),
    'hk_wide':     dict(setup='hockey', n=84, cam=orbit((8, 0), 30, -105, -80, 15.5, 1.0, 30), ease='lin', movers=['puck', 'flash']),
    # concert
    'cn_floor':    dict(setup='concert', n=96, cam=move((14.0, 3.0, 2.6), (-17.4, 0, 3.6), (6.0, 1.0, 3.2), (-17.4, 0, 3.4), 40, 45), ease='io', movers=['beams', 'flash']),
    'cn_wide':     dict(setup='concert', n=96, cam=orbit((-6, 0), 34, -55, -80, 16, 5, 24), ease='lin', movers=['beams', 'flash']),
    'cn_stage':    dict(setup='concert', n=84, cam=orbit((-21, 0), 8.5, -60, -25, 2.4, 3.6, 30), ease='lin', movers=['beams']),
    # fight night
    'bx_orbit':    dict(setup='boxing', n=96, cam=orbit((0, 0.3), 5.6, 12, 72, 3.5, 2.5, 40), ease='lin', focus=(0.1, 0.5, 2.8), f=4.5, movers=['flash']),
    'bx_overhead': dict(setup='boxing', n=96, cam=None, overhead=(0, 0, 11.4, 28, 10, 55), ease='lin', movers=['flash']),
    'bx_wide':     dict(setup='boxing', n=84, cam=move((2, -27.5, 11), (0, 0, 1.6), (1.5, -19, 7.0), (0, 0, 2.0), 32, 34), ease='io', movers=['flash']),
    # circus
    'cr_wire':     dict(setup='circus', n=96, cam=move((6.5, -10.0, 7.0), (-1.2, 0, 9.1), (2.0, -9.0, 8.0), (-2.4, 0, 9.1), 55), ease='lin', focus=(-1.6, 0, 9.4), f=5.6, movers=['walker']),
    'cr_ring':     dict(setup='circus', n=84, cam=orbit((0, 0), lambda u: 13.5 - 4.0 * u, -62, -112, 1.6, 1.2, 40), ease='lin', focus=(0, 1.5, 2.0), f=5.6, movers=['flash']),
    'cr_wide':     dict(setup='circus', n=96, cam=move((2, -24, 9), (0, 0, 4), (4, -34, 18), (0, 0, 3), 30, 26), ease='io', movers=['walker', 'flash']),
}
S = SHOTS[SHOT]; N = S['n']
fr = opt('--frames', 2, int, [1, N])
FRAMES = [1, N // 2, N] if TEST else list(range(fr[0], fr[1] + 1))

bpy.ops.wm.open_mainfile(filepath=os.path.join(WK, 'exterior_test.blend' if S['setup'] == 'exterior' else f"garden_{S['setup']}.blend"))
sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, N
O = bpy.data.objects
rng = random.Random(zlib_seed := sum(map(ord, SHOT)))

# ---------------- the camera
cd = bpy.data.cameras.new('anim'); cd.clip_end = 900; cam = O.new('cam_anim', cd); sc.collection.objects.link(cam); sc.camera = cam
for i in range(1, N + 1):
    u = ease((i - 1) / max(N - 1, 1), S.get('ease', 'io'))
    if S.get('overhead'):   # straight down, the frame turning about the ring
        x, y, z, lens, a0, a1 = S['overhead']; z = z - 1.2 * u
        cam.location = (x + 0.01, y, z); cam.rotation_euler = (0, 0, math.radians(a0 + (a1 - a0) * u)); cd.lens = lens
    else:
        loc, tgt, lens = S['cam'](u); cam.location = loc; cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cd.lens = lens
    cam.keyframe_insert('location', frame=i); cam.keyframe_insert('rotation_euler', frame=i); cd.keyframe_insert('lens', frame=i)
if S.get('focus'):
    fe = O.new('focus', None); sc.collection.objects.link(fe); fe.location = S['focus']; cd.dof.use_dof = True; cd.dof.focus_object = fe; cd.dof.aperture_fstop = S.get('f', 5.6)

# ---------------- what moves
def key_path(o, pts_fn, frames, rot_fn=None):
    for i in frames:
        o.location = pts_fn(i); o.keyframe_insert('location', frame=i)
        if rot_fn: o.rotation_euler = rot_fn(i); o.keyframe_insert('rotation_euler', frame=i)
movers = S.get('movers', [])
if 'shot' in movers and O.get('ball'):
    # the jumper: release over the shooter's head, a 4.2 m apex, through the rim at frame ~N-8
    b = O['ball']; b.animation_data_clear(); A = Vector((6.75, 3.55, 2.75)); B = Vector((12.755, 0.0, 3.05)); T = N - 8
    def bp(i):
        u = (i - 1) / T
        if u <= 1: p = A.lerp(B, u); p.z = A.z + (B.z - A.z) * u + 4 * 1.45 * u * (1 - u); return p
        v = (u - 1) * T / FPS; return Vector((B.x, B.y, B.z - 0.5 * 9.8 * v * v))   # through the net
    key_path(b, bp, range(1, N + 1), lambda i: (i * 0.21, i * 0.05, 0))
if 'puck' in movers and O.get('puck'):
    p = O['puck']; p0 = Vector(p.location); d = (Vector((26.5, 0.0, p0.z)) - p0)
    key_path(p, lambda i: p0 + d * min(1.0, (i - 1) / (N * 0.85)) ** 0.8, range(1, N + 1))
if 'train' in movers:
    # the train pulls in from the far end of the platform and stops: ease out over the whole shot
    for o in [o for o in O if o.name.startswith(('ext_train', 'ext_car_c')) and o.parent is None]:
        l0 = Vector(o.location)
        key_path(o, lambda i, l0=l0: l0 + Vector((78.0 * (1 - ease((i - 1) / (N - 1), 'out')) - 8.0, 0, 0)), range(1, N + 1))
if 'walker' in movers and O.get('walker'):
    w = O['walker']; w0 = Vector(w.location); r0 = w.rotation_euler.copy()
    pole = [o for o in O if o.parent is None and o.name.startswith('pole')]
    key_path(w, lambda i: w0 + Vector((0.55 * (i - 1) / N, 0, 0)), range(1, N + 1),
             lambda i: (r0.x + 0.035 * math.sin(i / 9.0), r0.y + 0.05 * math.sin(i / 7.0), r0.z))
    for po in pole:
        q0 = Vector(po.location); e0 = po.rotation_euler.copy()
        key_path(po, lambda i, q0=q0: q0 + Vector((0.55 * (i - 1) / N, 0, 0)), range(1, N + 1), lambda i, e0=e0: (e0.x + 0.06 * math.sin(i / 7.0), e0.y, e0.z))
if 'beams' in movers:
    # each narrow mover spot and its beam cone swing together about the fixture
    spots = [o for o in O if o.type == 'LIGHT' and o.name.startswith('mover')]
    beams = [o for o in O if o.type == 'MESH' and o.data.materials and o.data.materials[0] and o.data.materials[0].name.startswith('beam_')]
    for k, sp in enumerate(spots):
        piv = O.new(f'piv_{sp.name}', None); sc.collection.objects.link(piv); piv.location = sp.location
        bpy.context.view_layer.update()
        kids = [sp] + [bm for bm in beams if (bm.matrix_world @ Vector((0, 0, bm.dimensions.z / 2 / max(bm.scale.z, 1e-6))) - sp.location).length < 0.6]
        for c in kids:
            mw = c.matrix_world.copy(); c.parent = piv; c.matrix_parent_inverse = piv.matrix_world.inverted(); c.matrix_world = mw
        ph = rng.uniform(0, math.tau); amp = math.radians(rng.uniform(9, 16)); sp_ = rng.uniform(0.6, 1.0)
        for i in range(1, N + 1):
            t = i / FPS; piv.rotation_euler = (amp * math.sin(t * 2.2 * sp_ + ph), amp * 0.6 * math.cos(t * 1.7 * sp_ + ph), 0); piv.keyframe_insert('rotation_euler', frame=i)
if 'flash' in movers and O.get('crowd'):
    # phone and camera flashes in the seats: a point light lit for one frame, then gone
    pts = [v.co.copy() for v in O['crowd'].data.vertices]; cams_ = rng.sample(pts, min(len(pts), 70))
    ld = bpy.data.lights.new('flash', 'POINT'); ld.color = (0.9, 0.95, 1.0); ld.shadow_soft_size = 0.02
    for k, p in enumerate(cams_):
        l = bpy.data.lights.new(f'flash{k}', 'POINT'); l.color = (0.92, 0.95, 1.0); l.shadow_soft_size = 0.03
        o = O.new(f'flash{k}', l); sc.collection.objects.link(o); o.location = (p.x, p.y, p.z + 1.25)
        on = set(rng.sample(range(1, N + 1), 2))
        for i in range(1, N + 1):
            l.energy = 260.0 if i in on else 0.0; l.keyframe_insert('energy', frame=i)
# constant interpolation where a flash must not fade across frames
def _const(idb):
    ad = idb.animation_data
    if not ad or not ad.action: return
    try:
        for fc in ad.action.fcurves: [setattr(kp, 'interpolation', 'CONSTANT') for kp in fc.keyframe_points]
    except AttributeError:   # 5.x layered actions
        for lay in ad.action.layers:
            for st in lay.strips:
                for cb in st.channelbags: [setattr(kp, 'interpolation', 'CONSTANT') for fc in cb.fcurves for kp in fc.keyframe_points]
for l in bpy.data.lights:
    if l.name.startswith('flash'): _const(l)

# ---------------- render: Cycles, fewer samples than the stills, denoised, motion blur from the real moves
sc.render.engine = 'CYCLES'; sc.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'METAL'
sc.cycles.samples = SPP; sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'; sc.cycles.adaptive_threshold = 0.03
sc.render.use_persistent_data = True; sc.render.use_motion_blur = '--noblur' not in argv; sc.render.motion_blur_shutter = 0.5
sc.render.resolution_x, sc.render.resolution_y = RES; sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 94
od = os.path.join(OUT, SHOT); os.makedirs(od, exist_ok=True)
import time
for i in FRAMES:
    fp = os.path.join(od if not TEST else od + '_test', f'f_{i:04d}.jpg'); os.makedirs(os.path.dirname(fp), exist_ok=True)
    if os.path.exists(fp) and not TEST: continue
    t0 = time.time(); sc.frame_set(i); sc.render.filepath = fp; bpy.ops.render.render(write_still=True)
    print(f'ANIM {SHOT} frame {i}/{N} {time.time() - t0:.1f}s', flush=True)
