"""Inline data.json into island.html -> site/index.html. Run after make_atlases.py."""
import os
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, 'island.html')).read()
import json
d = json.load(open(os.path.join(H, '..', 'site', 'assets', 'data.json')))
d['sculpts'] = json.load(open(os.path.join(H, '..', 'site', 'assets', 'sculpts.json')))
data = json.dumps(d, separators=(',', ':'))
out = src.replace('/*__DATA__*/', data).replace('/*__V6_NATURE__*/', open(os.path.join(H, 'v6_nature.js')).read()).replace('/*__V7_ARCH__*/', open(os.path.join(H, 'v7_arch.js')).read()).replace('/*__V8_LAND__*/', open(os.path.join(H, 'v8_land.js')).read()).replace('/*__V9_DETAIL__*/', open(os.path.join(H, 'v9_detail.js')).read()).replace('/*__V10_INTERIORS__*/', open(os.path.join(H, 'v10_interiors.js')).read())
for _mk, _fn in [('V12_LIFE', 'v12_life.js'), ('V13_EGGS', 'v13_eggs.js'), ('V14_SECRETS', 'v14_secrets.js'), ('V15_POLISH', 'v15_polish.js'), ('V16_STREET', 'v16_street.js'), ('V17_NEON', 'v17_neon.js'), ('V18_WEATHER', 'v18_weather.js'), ('V19_GAMES', 'v19_games.js'), ('V20_FINALE', 'v20_finale.js'), ('V21_HARBOUR', 'v21_harbour.js'), ('V22_FOOD', 'v22_food.js'), ('V23_SKY', 'v23_sky.js'), ('V24_ANIMALS', 'v24_animals.js'), ('V25_PARADE', 'v25_parade.js')] + [('V%d_X' % i, 'v%d.js' % i) for i in range(26, 176)]:
    if os.path.exists(os.path.join(H, _fn)): out = out.replace('/*__%s__*/' % _mk, open(os.path.join(H, _fn)).read())
open(os.path.join(H, '..', 'site', 'index.html'), 'w').write(out)
print('site/index.html', len(out) // 1024, 'KB')

# artifact fragment: the publisher adds its own doctype/html/head/body skeleton
import re
frag = out.replace('<!doctype html>\n<html lang="en">\n<head>\n', '').replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
frag = re.sub(r'<meta[^>]*>\n', '', frag)
title = re.search(r'<title>.*?</title>\n', frag).group(0); frag = title + frag.replace(title, '', 1)
open(os.path.join(H, '..', 'site', 'artifact.html'), 'w').write(frag)
print('site/artifact.html', len(frag) // 1024, 'KB')
