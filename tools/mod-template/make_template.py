#!/usr/bin/env python3
"""把 mod-template 目录打包成官方模板 zip"""
import zipfile, os, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'anqu-mod-template-v1.zip')
if os.path.exists(OUT):
    os.remove(OUT)

json.load(open(os.path.join(HERE, 'mod.json')))  # 校验 JSON 合法

count = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(HERE):
        dirs[:] = [d for d in dirs if d != '.git']
        for f in sorted(files):
            if f.endswith('.zip') or f == 'gen_images.py' or f == 'make_template.py':
                continue
            p = os.path.join(root, f)
            rel = os.path.relpath(p, HERE)
            z.write(p, rel)
            count += 1

print('打包完成:', OUT, os.path.getsize(OUT), 'bytes,', count, 'files')
with zipfile.ZipFile(OUT) as z:
    for n in z.namelist():
        print(' ', n)
