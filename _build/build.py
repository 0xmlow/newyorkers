"""Inline data.json into island.html -> site/index.html. Run after make_atlases.py."""
import os
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, 'island.html')).read()
data = open(os.path.join(H, '..', 'site', 'assets', 'data.json')).read()
out = src.replace('/*__DATA__*/', data)
open(os.path.join(H, '..', 'site', 'index.html'), 'w').write(out)
print('site/index.html', len(out) // 1024, 'KB')
