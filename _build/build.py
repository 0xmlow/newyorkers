"""Assemble site/index.html: Win98 base CSS + extras, the shell, the vendor scripts, data inline, then engine + world + systems in one IIFE."""
import os, json, re
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(H, '..', 'site'); A = os.path.join(S, 'assets')
rd = lambda f: open(os.path.join(H, f)).read()
d = json.load(open(os.path.join(A, 'data.json'))); d['props'] = json.load(open(os.path.join(A, 'props.json'))); d['sculpts'] = json.load(open(os.path.join(A, 'sculpts.json')))
data = json.dumps(d, separators=(',', ':'))
crash = """<script id="crashjs">
(function () { var shown = 0; function show(m) { if (shown++ > 2) return; var c = document.getElementById('crash'), p = document.getElementById('crashMsg'); if (!c || !p) return; p.textContent += (p.textContent ? '\\n' : '') + m; c.style.display = 'flex'; }
  window.addEventListener('error', function (e) { var f = e.filename || ''; if (/^(chrome|moz|safari)(-web)?-extension:/.test(f) || /ethereum|solana|phantom|metamask/i.test(e.message || '')) return; show((e.message || 'Error') + (e.filename ? '\\n' + e.filename.split('/').pop() + ':' + e.lineno : '')); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; if (r && r.stack && /-extension:/.test(r.stack)) return; show('Promise: ' + (r && r.message ? r.message : String(r))); });
  document.addEventListener('click', function (e) { if (e.target && (e.target.id === 'crashOk' || e.target.id === 'crashX')) document.getElementById('crash').style.display = 'none'; });
})();
</script>"""
vendor = ''.join(f'<script src="vendor/{v}"></script>\n' for v in ['three.min.js', 'GLTFLoader.js', 'meshopt_decoder.js', 'CopyShader.js', 'LuminosityHighPassShader.js', 'GammaCorrectionShader.js', 'EffectComposer.js', 'RenderPass.js', 'ShaderPass.js', 'MaskPass.js', 'UnrealBloomPass.js', 'GLTFExporter.js'])
js = rd('engine.js') + '\n' + rd('world.js') + '\n' + rd('systems.js')
page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>YOUR MOM'S BASEMENT</title>
<link rel="icon" href="assets/eye.png">
<link rel="stylesheet" href="fonts/fonts.css">
<style>{rd('base.css')}{rd('extra.css')}</style>
</head>
<body>
{rd('shell.html')}<img id="eyeImg" src="assets/eye.png" alt="" style="display:none">
{crash}
{vendor}<script>window.YMB_DATA={data};</script>
<script>
(function(){{"use strict";
{js}
}})();
</script>
</body>
</html>
"""
open(os.path.join(S, 'index.html'), 'w').write(page); print('site/index.html', len(page) // 1024, 'KB')

# artifact fragment: the publisher adds its own doctype/html/head/body skeleton
frag = page.replace('<!doctype html>\n<html lang="en">\n<head>\n', '').replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
frag = re.sub(r'<meta[^>]*>\n', '', frag); title = re.search(r'<title>.*?</title>\n', frag).group(0); frag = title + frag.replace(title, '', 1)
open(os.path.join(S, 'artifact.html'), 'w').write(frag); print('site/artifact.html', len(frag) // 1024, 'KB')
