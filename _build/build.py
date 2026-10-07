"""Inline data.json into island.html -> site/index.html. Run after make_atlases.py."""
import os
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, 'island.html')).read()
data = open(os.path.join(H, '..', 'site', 'assets', 'data.json')).read()
out = src.replace('/*__DATA__*/', data)
open(os.path.join(H, '..', 'site', 'index.html'), 'w').write(out)
print('site/index.html', len(out) // 1024, 'KB')

# artifact fragment: the publisher adds its own doctype/html/head/body skeleton
import re
frag = out.replace('<!doctype html>\n<html lang="en">\n<head>\n', '').replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
frag = re.sub(r'<meta[^>]*>\n', '', frag)
title = re.search(r'<title>.*?</title>\n', frag).group(0); frag = title + frag.replace(title, '', 1)
open(os.path.join(H, '..', 'site', 'artifact.html'), 'w').write(frag)
print('site/artifact.html', len(frag) // 1024, 'KB')
