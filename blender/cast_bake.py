"""cast_bake.py: MLow's rigged NEW YORKERS cast (UPGRADE ALL ROOMS 2026-10-28/rig/out) frozen into static meshes for Cycles.
  Blender -b --factory-startup --python blender/cast_bake.py -- [lineup]
Each figure gets its own idle clip (the one its import created) and is then posed by bone directions into a family of
crowd poses: seated with hands on the lap, seated leaning on the knees, seated clapping, seated with one arm up, standing,
standing with both arms up. Armature applied, Blender's glTF bone shapes dropped, turned to face -y, centred.
Seated figures are placed with the hip joints at (0, +0.05, 0.55) over the tread; standing ones with the feet on z = 0.
Writes blender/work/cast.blend (collection 'cast', objects cast_<name>_<pose>, custom prop 'seated')."""
import bpy, os, sys, math
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); DESK = os.path.dirname(os.path.dirname(HERE))
RIG = os.path.join(DESK, 'UPGRADE ALL ROOMS 2026-10-28', 'rig', 'out')
D = math.pi / 180
FACE = {'blindwoman': -90 * D, 'hustler': -90 * D, 'lensman': 90 * D, 'tough': 90 * D, 'sally': 90 * D}   # rigcast.js
SKIP = {'blindwoman', 'prince', 'clerk', 'felix', 'robber', 'lensman', 'actress', 'gown', 'folksinger', 'sally', 'maitre'}
NAMES = sorted(f[:-4] for f in os.listdir(RIG) if f.endswith('.glb') and not f.endswith('_lite.glb') and f[:-4] not in SKIP)
F, B, U, DN = Vector((0, -1, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)), Vector((0, 0, -1))
# pose: bone -> target direction in world space (after the FACE turn), applied parent first
def V(x, y, z): return Vector((x, y, z)).normalized()
SEAT_LEGS = {'thigh_L': V(0.12, -1, 0.06), 'thigh_R': V(-0.12, -1, 0.06), 'shin_L': V(0.03, 0.12, -1), 'shin_R': V(-0.03, 0.12, -1), 'foot_L': V(0, -1, -0.15), 'foot_R': V(0, -1, -0.15)}
SEAT_LEGS['skirt'] = V(0, -1, -0.5)
POSES = {   # arms stay close to the idle: coats and sleeves tear when an arm swings far from where it was weighted
    'sit':      dict(legs=SEAT_LEGS, arms={'forearm_L': V(-0.1, -0.8, -0.6), 'forearm_R': V(0.1, -0.8, -0.6)}, spine=V(0, 0.06, 1)),
    'sit_lean': dict(legs=SEAT_LEGS, arms={'forearm_L': V(-0.2, -0.9, -0.3), 'forearm_R': V(0.2, -0.9, -0.3)}, spine=V(0, -0.35, 1)),
    'sit_clap': dict(legs=SEAT_LEGS, arms={'upperarm_L': V(0.1, -0.35, -1), 'upperarm_R': V(-0.1, -0.35, -1), 'forearm_L': V(-0.45, -1, 0.35), 'forearm_R': V(0.45, -1, 0.35)}, spine=V(0, 0.0, 1)),
    'stand':    dict(legs={}, arms={}, spine=None),
}
# heads turned: talking to a neighbour, checking the board (Astra round 2, item 8)
for base in ('sit', 'sit_clap', 'sit_lean'):
    for k, yw in (('L', 0.45), ('R', -0.45)): POSES[f'{base}{k}'] = dict(POSES[base], yaw=yw)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
out = bpy.data.collections.new('cast'); sc.collection.children.link(out)

def aim(arm, name, target_world):
    pb = arm.pose.bones.get(name)
    if not pb: return
    bpy.context.view_layer.update()
    W = arm.matrix_world; Wi = W.inverted()
    head = pb.head.copy(); d = (pb.tail - pb.head)
    if d.length < 1e-6: return
    t = (Wi.to_3x3() @ target_world).normalized()
    q = d.normalized().rotation_difference(t)
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ pb.matrix

for name in NAMES:
    before = set(bpy.data.objects); acts0 = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=os.path.join(RIG, name + '.glb'))
    new = [o for o in bpy.data.objects if o not in before]; acts = [a for a in bpy.data.actions if a not in acts0]
    arm = next((o for o in new if o.type == 'ARMATURE'), None)
    meshes = [o for o in new if o.type == 'MESH' and (o.data.materials or any(m.type == 'ARMATURE' for m in o.modifiers))]
    idle = next((a for a in acts if a.name.lower().startswith('idle')), None)
    if arm and arm.animation_data is None: arm.animation_data_create()
    rz = FACE.get(name, 0.0)
    for pname, P in POSES.items():
        if arm:
            arm.animation_data.action = idle
            if idle: sc.frame_set(int(idle.frame_range[0]) + (list(POSES).index(pname) % 7) * 6)
            bpy.context.view_layer.update()
            arm.animation_data.action = None   # keep the idle's pose as the base, then aim bones over it
            # turn the target directions into the figure's own facing before the FACE correction
            R = Matrix.Rotation(-rz, 3, 'Z')
            for bn in ('spine',):
                if P['spine'] is not None: aim(arm, 'spine', R @ P['spine'])
            for k, v in list(P['legs'].items()) + list(P['arms'].items()): aim(arm, k, R @ v)
            if P.get('yaw') and 'neck' in arm.pose.bones:
                bpy.context.view_layer.update(); pb = arm.pose.bones['neck']; ax = (arm.matrix_world.inverted().to_3x3() @ Vector((0, 0, 1))).normalized(); h0 = pb.head.copy()
                pb.matrix = Matrix.Translation(h0) @ Matrix.Rotation(P['yaw'], 4, ax) @ Matrix.Translation(-h0) @ pb.matrix
        bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); parts = []
        for m in meshes:
            ev = m.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev, depsgraph=dg); me.transform(m.matrix_world); parts.append(me)
        objs = []
        for me in parts: o = bpy.data.objects.new('tmp', me); sc.collection.objects.link(o); objs.append(o)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.name = f'cast_{name}_{pname}'
        o.data.transform(Matrix.Rotation(rz, 4, 'Z'))
        vs = [v.co for v in o.data.vertices]; mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))); mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
        seated = pname.startswith('sit')
        if seated and arm:
            hip = (arm.matrix_world @ arm.pose.bones['thigh_L'].head + arm.matrix_world @ arm.pose.bones['thigh_R'].head) / 2
            hip = Matrix.Rotation(rz, 3, 'Z') @ hip
            o.data.transform(Matrix.Translation(Vector((-hip.x, 0.05 - hip.y, 0.55 - hip.z))))
        else:
            o.data.transform(Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))))
        o.data.shade_smooth(); o.location = (0, 0, 0)
        for c in o.users_collection: c.objects.unlink(o)
        out.objects.link(o); o['seated'] = seated; o['height'] = mx.z - mn.z
        if arm:
            for pb in arm.pose.bones: pb.matrix_basis = Matrix()
    for o in new:
        if o.name in bpy.data.objects: bpy.data.objects.remove(o, do_unlink=True)
    for a in acts: bpy.data.actions.remove(a)
    print('baked', name)
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'work', 'cast.blend'))
if 'lineup' in sys.argv:
    for o in out.objects: o.hide_render = True
    objs = [o for o in out.objects]
    objs.sort(key=lambda o: o.name)
    for i, o in enumerate(objs): o.hide_render = False; o.location = ((i % 8) * 1.3, 0, -(i // 8) * 2.3)
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); cam.data.type = 'ORTHO'; cam.data.ortho_scale = 24
    cam.location = (4.5, -20, -9.5); cam.rotation_euler = (math.radians(90), 0, 0); sc.camera = cam
    side = bpy.data.objects.new('c2', bpy.data.cameras.new('c2')); sc.collection.objects.link(side); side.data.type = 'ORTHO'; side.data.ortho_scale = 15
    side.location = (20, 0, -5.5); side.rotation_euler = (math.radians(90), 0, math.radians(90))
    l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'SUN')); l.data.energy = 4; l.rotation_euler = (0.9, 0.2, -0.4); sc.collection.objects.link(l)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1500, 2300
    sc.render.filepath = os.path.join(HERE, 'work', 'cast_lineup.png'); bpy.ops.render.render(write_still=True)
    sc.camera = side; sc.render.filepath = os.path.join(HERE, 'work', 'cast_lineup_side.png'); bpy.ops.render.render(write_still=True)
