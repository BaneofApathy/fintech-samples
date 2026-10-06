#!/usr/bin/env python3
"""Rebuild the notebook sub-site and point its kernel at the shared offline runtime."""
from pathlib import Path
import json, subprocess, sys, shutil, site
from jupyter_core.paths import jupyter_path
ROOT=Path(__file__).resolve().parents[1]
output=ROOT/'public/labs'
# Generate the same authored content used by the unit runner and downloads before
# packaging the notebook workspace.
subprocess.run([sys.executable, str(ROOT/'scripts/make-labs.py')], check=True)
cli=shutil.which('jupyter-lite') or str(Path(site.USER_BASE)/'bin/jupyter-lite')
extension=next((Path(p)/'@jupyterlite/pyodide-kernel-extension' for p in jupyter_path('labextensions') if (Path(p)/'@jupyterlite/pyodide-kernel-extension/package.json').exists()),None)
if not extension:raise SystemExit('Install requirements-build.txt before rebuilding the notebook workspace.')
subprocess.run([cli,'build','--contents=.',f'--output-dir={output}','--no-sourcemaps','--no-unused-shared-packages',f'--LiteBuildConfig.federated_extensions=["{extension}"]'],cwd=ROOT/'labs',check=True)
p=output/'jupyter-lite.json';config=json.loads(p.read_text());data=config['jupyter-config-data']
settings=data.setdefault('litePluginSettings',{}).setdefault('@jupyterlite/pyodide-kernel-extension:kernel',{})
settings.update(pyodideUrl='../../python/pyodide.js',disablePyPIFallback=True,loadPyodideOptions={'packages':['numpy','pandas','scikit-learn','statsmodels','networkx','matplotlib','ipython','micropip']})
data['enableServiceWorkerCache']=True
p.write_text(json.dumps(config,indent=2))
# Share the course precache with JupyterLite's more-specific service-worker
# scope while preserving its virtual drive and stdin handlers.
worker=output/'service-worker.js';js=worker.read_text()
old='async function fromCache(e){const t=await openCache(),a=await t.match(e);return a&&404!==a.status?a:null}'
bridge="""async function fromCache(e){const u=new URL(e.url);u.search='';for(const name of (await caches.keys()).reverse()){if(!name.startsWith('fintech-'))continue;const c=await caches.open(name);let r=await c.match(u.href);if(!r&&u.pathname.endsWith('/'))r=await c.match(u.href+'index.html');if(r)return r;}const c=await openCache(),r=await c.match(e);return r&&r.status!==404?r:null}"""
if old not in js and "startsWith('fintech-')" not in js:raise SystemExit('JupyterLite service-worker structure changed; review the offline bridge.')
js=js.replace(old,bridge).replace('shouldDrop(t,a)||(n=maybeFromCache(e))','"GET"===t.method&&(n=maybeFromCache(e))')
start=js.index('async function maybeFromCache(e)');end=js.index('async function fromCache(e)',start)
js=js[:start]+"""async function maybeFromCache(e){const r=await fromCache(e.request);if(r)return r;try{const response=await fetch(e.request);if(response.ok)await updateCache(e.request,response.clone());return response;}catch{return new Response('Offline resource unavailable',{status:404});}}"""+js[end:]
worker.write_text(js)
# A sub-site must register its own worker rather than reuse or unregister the
# course worker that already controls the root application.
for bundle in (output/'build').glob('*.js'):
    text=bundle.read_text()
    if 'async _unregisterOldServiceWorkers(e)' not in text:continue
    text=text.replace('if(t.controller){const e=t.controller.scriptURL;', 'if(t.controller&&new URL(t.controller.scriptURL).pathname===new URL(e).pathname){const e=t.controller.scriptURL;')
    text=text.replace('async _unregisterOldServiceWorkers(e){const t=', 'async _unregisterOldServiceWorkers(e){const scope=new URL("./",e).href;const t=')
    text=text.replace('await Promise.all(e.map((e=>e.unregister())))', 'await Promise.all(e.filter(r=>r.scope===scope).map((e=>e.unregister())))')
    bundle.write_text(text)

# The course's labs directory page replaces this launcher. Its Jupyter config tag
# lets config-utils merge the local root settings without changing the course UI.
(output/'index.html').unlink(missing_ok=True)
print('Bundled JupyterLite workspace:',output)
