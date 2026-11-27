"""exterior_test.py: build only the outside of THE GARDEN (plus a dark stand-in for the interior) and render its cameras.
  Blender -b --factory-startup --python blender/exterior_test.py -- [qa|full] [camera ...]
Renders blender/renders/ext_<name>_<mode>.png (qa 1280x720 at 64 samples; Metal, OIDN, AgX Medium High Contrast)."""
import bpy, os, sys, time, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import importlib, exterior
importlib.reload(exterior)
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = argv[0] if argv and argv[0] in ('qa', 'full') else 'qa'
PICK = [a for a in argv if a not in ('qa', 'full')]
OUT = os.path.join(HERE, 'renders'); os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
t0 = time.time()
cams = exterior.build_exterior(MODE)
print('build %.1f s' % (time.time() - t0))
# the interior contract: nothing of ours inside r 63.6 above z -2 except the escalator landing (x > 63.6) and the roof over z 35.2
import numpy as np
bad = []
bpy.context.view_layer.update()
for o in bpy.data.collections['exterior'].all_objects:
    if o.type != 'MESH' or o.name.startswith('ext_nyer'): continue
    co = np.zeros(len(o.data.vertices) * 3); o.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    if not len(co): continue
    m = np.array(o.matrix_world); co = co @ m[:3, :3].T + m[:3, 3]
    if np.any((co[:, 2] > -2) & (co[:, 2] < 35.5) & (np.hypot(co[:, 0], co[:, 1]) < 63.5)): bad.append(o.name)
print('INTERIOR CHECK', 'clean' if not bad else sorted(set(bad))[:20])

# a stand-in for the interior: the inner face of the drum, a concourse floor at z = 0 and a warm glow, so the hall opening
# shows something; build_garden.py replaces all of this
ph = bpy.data.collections.new('interior_placeholder'); sc.collection.children.link(ph)
dark = bpy.data.materials.new('ph_dark'); dark.use_nodes = True; dark.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.02, 0.02, 0.025, 1)
glow = bpy.data.materials.new('ph_glow'); glow.use_nodes = True; b = glow.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.1, 0.08, 0.06, 1)
b.inputs['Emission Color'].default_value = (1, 0.75, 0.5, 1); b.inputs['Emission Strength'].default_value = 1.5
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=63.55, depth=37.2, location=(0, 0, 16.6), end_fill_type='NOTHING'); o = bpy.context.active_object
o.data.materials.append(dark); o.name = 'ph_drum_inside'
for cc in list(o.users_collection): cc.objects.unlink(o)
ph.objects.link(o)
bpy.ops.mesh.primitive_circle_add(vertices=128, radius=63.5, fill_type='NGON', location=(0, 0, 0.0)); o = bpy.context.active_object; o.data.materials.append(glow); o.name = 'ph_floor'
for cc in list(o.users_collection): cc.objects.unlink(o)
ph.objects.link(o)

for name, (loc, tgt, lens) in cams.items():
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_start = 0.1; cd.clip_end = 3000; o = bpy.data.objects.new('cam_' + name, cd); o.location = loc
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(o)

sc.render.engine = 'CYCLES'; prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'; sc.cycles.samples = 256 if MODE == 'full' else 64; sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 6; sc.cycles.glossy_bounces = 3; sc.cycles.transmission_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.cycles.light_sampling_threshold = 0.01
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = float(os.environ.get('EXT_EXPOSURE', exterior.EXPOSURE))
sc.render.resolution_x, sc.render.resolution_y = (2560, 1440) if MODE == 'full' else (1280, 720)
sc.render.image_settings.file_format = 'PNG'
if os.environ.get('EXT_SAVE'): bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'work', 'exterior_test.blend'))
for name in ([] if PICK == ['check'] else (PICK or list(cams))):
    if name not in cams: name = 'ext_' + name
    t = time.time(); sc.camera = bpy.data.objects['cam_' + name]; sc.render.filepath = os.path.join(OUT, f'{name}_{MODE}.png')
    bpy.ops.render.render(write_still=True); print('RENDERED %s %.1f s' % (name, time.time() - t))
