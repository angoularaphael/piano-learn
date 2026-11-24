"""Met a jour la liste des fichiers gardes hors ligne (sw.js) et sa version.
A relancer avant chaque commit qui change un fichier du site.

    python tools/precache.py
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ['css', 'js', 'vendor', 'fonts', 'icons', 'sounds']
FILES = ['index.html', 'favicon.svg', 'manifest.webmanifest']
EXT = {'.html', '.css', '.js', '.json', '.svg', '.png', '.woff2', '.mp3', '.glb', '.webmanifest'}

paths = list(FILES)
for d in DIRS:
    for base, _, names in os.walk(os.path.join(ROOT, d)):
        for n in names:
            if os.path.splitext(n)[1] in EXT:
                paths.append(os.path.relpath(os.path.join(base, n), ROOT).replace(os.sep, '/'))
paths.sort()

h = hashlib.sha256()
for p in paths:
    h.update(p.encode())
    with open(os.path.join(ROOT, p), 'rb') as f:
        h.update(f.read())
version = 'pl-app-' + h.hexdigest()[:10]

listing = ',\n  '.join(f"'{p}'" for p in ['./'] + paths)
block = f"// PRECACHE-START\nconst VERSION = '{version}';\nconst PRECACHE = [\n  {listing},\n];\n// PRECACHE-END"
sw = os.path.join(ROOT, 'sw.js')
text = open(sw, encoding='utf-8').read()
text = re.sub(r'// PRECACHE-START.*?// PRECACHE-END', lambda _: block, text, flags=re.S)
open(sw, 'w', encoding='utf-8').write(text)
print(version, len(paths), 'fichiers')
