# export the CC0 Human Base Meshes (realistic male and female, level 0 cage) to npz for posing in numpy
import bpy, numpy as np, sys, os
out = sys.argv[sys.argv.index('--') + 1]
for name in ['GEO-body_male_realistic', 'GEO-body_female_realistic']:
    o = bpy.data.objects[name]
    me = o.data; n = len(me.vertices)
    v = np.zeros(n * 3); me.vertices.foreach_get('co', v); v = v.reshape(-1, 3)
    faces = [list(p.vertices) for p in me.polygons]
    lens = np.array([len(f) for f in faces]); flat = np.array(sum(faces, []))
    np.savez(os.path.join(out, name.split('-')[1] + '.npz'), v=v, lens=lens, flat=flat)
    print(name, v.min(0), v.max(0))
