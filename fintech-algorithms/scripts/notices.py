from pathlib import Path
import json,zipfile,re,urllib.request
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'public/licenses';out.mkdir(exist_ok=True)
components=['astro','@astrojs/starlight','@astrojs/svelte','@astrojs/mdx','svelte','katex','d3','reveal.js','pagefind']
rows=[]
for name in components:
 folder=ROOT/'node_modules'/name;meta=json.loads((folder/'package.json').read_text());safe=name.replace('/','-').replace('@','')
 found=[]
 for p in folder.iterdir():
  if p.is_file() and re.match(r'(LICENSE|LICENCE|COPYING|NOTICE)',p.name,re.I):
   dest=out/f'{safe}-{p.name}';dest.write_bytes(p.read_bytes());found.append(dest.name)
 rows.append((name,meta['version'],meta.get('license','See package notices'),found))
for folder in (ROOT/'node_modules/.pnpm').glob('d3-*'):
 for p in (folder/'node_modules').glob('d3-*/*LICENSE*'):
  if p.is_file():(out/(p.parent.name+'-'+p.name)).write_bytes(p.read_bytes())
for wheel in (ROOT/'public/python').glob('*.whl'):
 with zipfile.ZipFile(wheel) as z:
  for name in z.namelist():
   if re.search(r'(^|/)(LICENSE|LICENCE|COPYING|NOTICE|COPYRIGHT)',name,re.I) and not name.endswith('/'):
    dest=out/'python'/wheel.name/Path(name);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(name))
try:
 req=urllib.request.Request('https://raw.githubusercontent.com/pyodide/pyodide/0.29.3/LICENSE',headers={'User-Agent':'FintechCourseBuild/1.0'})
 with urllib.request.urlopen(req,timeout=30) as r:(out/'pyodide-LICENSE').write_bytes(r.read())
except Exception as e:print('Pyodide license download:',str(e))
text=['# Third-party notices','','The application bundles the following open-source components. Their licenses and notices are retained in `public/licenses/`, inside the Python wheel archives, and in the JupyterLite license API. Exact development dependencies are listed in `pnpm-lock.yaml`.','','| Component | Version | License |','|---|---|---|']
text += [f'| {n} | {v} | {l} |' for n,v,l,_ in rows]
text += ['| Pyodide | 0.29.3 | MPL-2.0; bundled packages retain their own licenses |','| JupyterLite core | 0.7.6 | BSD-3-Clause |','| JupyterLite Pyodide kernel | 0.7.2 | BSD-3-Clause |','','Scientific package versions are recorded in `metadata/PYTHON_PINS.json`. JupyterLite includes its third-party license listings under `public/labs/lab/api/licenses`.','','Pyodide source: https://github.com/pyodide/pyodide/tree/0.29.3. JupyterLite source: https://github.com/jupyterlite/jupyterlite. No pretrained model weights are included.','','The course is authored by Adnan Masood, PhD., USF. The original authoring materials are kept in the project and are not published with the application.']
(ROOT/'THIRD_PARTY_NOTICES.md').write_text('\n'.join(text)+'\n');print('Saved notices for',len(rows),'JavaScript components and bundled Python packages.')
