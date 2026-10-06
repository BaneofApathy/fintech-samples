#!/usr/bin/env python3
"""Vendor the pinned Pyodide runtime and the transitive scientific wheels."""
from pathlib import Path
import urllib.request,json,concurrent.futures
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/python';out.mkdir(parents=True,exist_ok=True)
BASE='https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'
def download(name):
    p=out/name
    if p.exists() and p.stat().st_size>0:return name
    req=urllib.request.Request(BASE+name,headers={'User-Agent':'FintechCourseBuild/1.0'})
    with urllib.request.urlopen(req,timeout=90) as r:p.write_bytes(r.read())
    return name
download('pyodide-lock.json');lock=json.loads((out/'pyodide-lock.json').read_text())
needed=set()
def collect(k):
    k=k.replace('_','-')
    if k in needed:return
    needed.add(k)
    for d in lock['packages'][k].get('depends',[]):collect(d)
for k in ['numpy','pandas','scikit-learn','statsmodels','networkx','matplotlib','ipython','jedi','micropip']:collect(k)
names=['pyodide.js','pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip']+[lock['packages'][k]['file_name'] for k in needed]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for name in pool.map(download,names):print(name,flush=True)
pins={k:lock['packages'][k]['version'] for k in sorted(needed)}
(ROOT/'metadata/PYTHON_PINS.json').write_text(json.dumps(dict(pyodide='0.29.3',packages=pins),indent=2))
print('Vendored',len(names),'files;',round(sum(p.stat().st_size for p in out.iterdir())/1e6,1),'MB')

(out/'package.json').write_text(json.dumps({'type':'commonjs'}))
