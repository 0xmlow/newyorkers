"""exterior_cast.py: MLow's rigged NEW YORKERS cast frozen mid stride for the streets round THE GARDEN.
  Blender -b --factory-startup --python blender/exterior_cast.py -- [lineup]
Each figure (UPGRADE ALL ROOMS 2026-10-28/rig/out, the full files, never *_lite): its walk clip at 1/3 and 2/3 of the clip
(objects extc_<name>_w1, extc_<name>_w2) and its idle clip at the first frame (extc_<name>_i). Figures with no walk clip get
the idle only. Armature applied, the glTF importer's Icosphere bone shapes dropped, turned to face -y (the FACE table from
rigcast.js, same as cast_bake.py), feet on z = 0, centred on x, y. Custom props: height, walker (1 for a walk pose).
Writes blender/work/cast_walk.blend (collection 'cast_walk')."""
import bpy, os, sys, math
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); DESK = os.path.dirname(os.path.dirname(HERE))
RIG = os.path.join(DESK, 'UPGRADE ALL ROOMS 2026-10-28', 'rig', 'out')
D = math.pi / 180
FACE = {'blindwoman': -90 * D, 'hustler': -90 * D, 'lensman': 90 * D, 'tough': 90 * D, 'sally': 90 * D}
SKIP = {'blindwoman', 'prince', 'clerk', 'felix', 'robber', 'lensman', 'actress', 'gown'}   # props, a wheelchair, gowns
NAMES = sorted(f[:-4] for f in os.listdir(RIG) if f.endswith('.glb') and not f.endswith('_lite.glb') and f[:-4] not in SKIP)
OUT = os.path.join(HERE, 'work', 'cast_walk.blend')

bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
out = bpy.data.collections.new('cast_walk'); sc.collection.children.link(out)


def freeze(meshes, label, name, walker):
    dg = bpy.context.evaluated_depsgraph_get(); objs = []
    for m in meshes:
        ev = m.evaluated_get(dg); me = bpy.data.meshes.new_from_object(ev, depsgraph=dg); me.transform(m.matrix_world)
        o = bpy.data.objects.new('tmp', me); sc.collection.objects.link(o); objs.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = f'extc_{name}_{label}'
    o.data.transform(Matrix.Rotation(FACE.get(name, 0.0), 4, 'Z'))
    vs = [v.co for v in o.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))); mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    o.data.transform(Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))))
    o.data.shade_smooth(); o.location = (0, 0, 0)
    for c in list(o.users_collection): c.objects.unlink(o)
    out.objects.link(o); o['height'] = mx.z - mn.z; o['walker'] = 1 if walker else 0
    return o


for name in NAMES:
    before_o = set(bpy.data.objects); before_a = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=os.path.join(RIG, name + '.glb'))
    new = [o for o in bpy.data.objects if o not in before_o]; acts = [a for a in bpy.data.actions if a not in before_a]
    arm = next((o for o in new if o.type == 'ARMATURE'), None)
    # skinned meshes only: the importer's bone display shapes (Icosphere) carry no material and no armature modifier
    meshes = [o for o in new if o.type == 'MESH' and (o.data.materials or any(m.type == 'ARMATURE' for m in o.modifiers)) and not o.name.startswith('Icosphere')]
    walk = next((a for a in acts if a.name.lower().startswith('walk')), None) or next((a for a in acts if 'walk' in a.name.lower()), None)
    idle = next((a for a in acts if a.name.lower().startswith('idle')), None) or next((a for a in acts if 'idle' in a.name.lower()), None)
    if arm is None:
        print('no armature', name); continue
    if arm.animation_data is None: arm.animation_data_create()
    for t in arm.animation_data.nla_tracks: t.mute = True

    def use(act):
        arm.animation_data.action = act
        try:
            if getattr(act, 'slots', None) and len(act.slots): arm.animation_data.action_slot = act.slots[0]
        except Exception: pass
    shots = []
    if walk:
        f0, f1 = walk.frame_range
        shots += [(walk, f0 + (f1 - f0) / 3.0, 'w1', True), (walk, f0 + 2 * (f1 - f0) / 3.0, 'w2', True)]
    if idle: shots.append((idle, idle.frame_range[0], 'i', False))
    for act, fr, label, walker in shots:
        use(act); sc.frame_set(int(fr), subframe=fr - int(fr))
        freeze(meshes, label, name, walker)
    for o in new:
        if o.name in bpy.data.objects: bpy.data.objects.remove(o, do_unlink=True)
    for a in acts: bpy.data.actions.remove(a)
    print('baked', name, 'walk' if walk else 'idle only')

bpy.ops.outliner.orphans_purge(do_recursive=True)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('wrote', OUT, len(out.objects), 'figures')

if 'lineup' in sys.argv:
    objs = sorted(out.objects, key=lambda o: o.name)
    for i, o in enumerate(objs): o.location = ((i % 12) * 1.1, 0, -(i // 12) * 2.4)
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); cam.data.type = 'ORTHO'; cam.data.ortho_scale = 14
    cam.location = (6, -20, -2.5); cam.rotation_euler = (math.radians(90), 0, math.radians(-0)); sc.camera = cam
    l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'SUN')); l.data.energy = 4; l.rotation_euler = (0.9, 0.2, -0.4); sc.collection.objects.link(l)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
    sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 2000, 1200
    sc.render.filepath = os.path.join(HERE, 'work', 'cast_walk_lineup.png'); bpy.ops.render.render(write_still=True)
