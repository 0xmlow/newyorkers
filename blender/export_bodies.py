# export the CC0 Human Base Meshes (realistic male and female) to npz for posing in numpy.
# People pass 2026-11-27: the sculpted Multires level (default 2, ~170k verts), not the level 0 cage; the cage threw away the
# anatomy (clavicles, knees, hands) and read as a mannequin. Writes body_<name>.npz (sculpted) and body_<name>_cage.npz.
import bpy, numpy as np, sys, os
out = sys.argv[sys.argv.index('--') + 1]; LV = int(os.environ.get('HBM_LEVEL', '2'))
def dump(me, path):
    n = len(me.vertices); v = np.zeros(n * 3); me.vertices.foreach_get('co', v); v = v.reshape(-1, 3)
    lens = np.zeros(len(me.polygons), int); me.polygons.foreach_get('loop_total', lens)
    flat = np.zeros(len(me.loops), int); me.loops.foreach_get('vertex_index', flat)
    np.savez(path, v=v, lens=lens, flat=flat); print(path, n, v.min(0), v.max(0))
for name in ['GEO-body_male_realistic', 'GEO-body_female_realistic']:
    o = bpy.data.objects[name]; base = name.split('-')[1]
    dump(o.data, os.path.join(out, base + '_cage.npz'))
    for m in o.modifiers:
        if m.type == 'MULTIRES': m.levels = m.render_levels = LV
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
    dump(me, os.path.join(out, base + '.npz'))
