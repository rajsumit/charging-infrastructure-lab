#!/usr/bin/env python3
"""Build the site into docs/index.html (standalone page for GitHub Pages) and dist/artifact.html (fragment)."""
import os, re
root = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(root, 'src')
rd = lambda f: open(os.path.join(src, f), encoding='utf8').read()
order = ['home', 'schem', 'circ', 'easy', 'cppp', 'extra', 'sim', 'chain', 'states', 'view3d', 'm1', 'm2', 'm3', 'm4', 'm5']
files = ['calc.js', 'imgs.js', 'qbank1.js', 'qbank2.js', 'qbank3.js', 'core.js', 'topics/00util.js'] + ['topics/%s.js' % o for o in order]
code = '\n;\n'.join(rd(f) for f in files) + '\n;\ntry{boot();}catch(e){console.error(e);document.getElementById("page").textContent="Error: "+e.message}\n'
frag = rd('shell.html').replace('/*CSS*/', rd('style.css')).replace('/*JS*/', code.replace('</script', '<\\/script'))
os.makedirs(os.path.join(root, 'dist'), exist_ok=True); os.makedirs(os.path.join(root, 'docs'), exist_ok=True)
open(os.path.join(root, 'dist', 'artifact.html'), 'w', encoding='utf8').write(frag)
m = re.search(r'<title>.*?</title>', frag); title = m.group(0); body = frag.replace(title, '', 1)
page = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        + title + '<meta name="description" content="Interactive study lab for the NPTEL course Charging Infrastructure (IIT Roorkee): waveforms, 3D models, calculators and the assignment question bank.">'
        '<style>html{color-scheme:light}body{margin:0}</style></head><body>' + body + '</body></html>')
open(os.path.join(root, 'docs', 'index.html'), 'w', encoding='utf8').write(page)
print('built', len(page) // 1024, 'KB')
