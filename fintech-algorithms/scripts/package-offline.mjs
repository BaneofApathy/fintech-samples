import { spawnSync } from 'node:child_process';
const code = String.raw`from pathlib import Path
import zipfile,hashlib
root=Path.cwd();out=root/'artifacts'/'USF_Fintech_Algorithms_App.zip'
out.parent.mkdir(exist_ok=True)
excluded={'node_modules','.git','.astro','.venv','__pycache__','.cache','.pnpm-store','.codex','.agents','test-results','playwright-report','artifacts','.vercel'}
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(root.rglob('*')):
  if not p.is_file() or any(x in excluded for x in p.relative_to(root).parts) or p.relative_to(root).parts[0]=='source' or (p.relative_to(root).parts[0]=='qa' and p.name!='.gitkeep') or p.name.startswith('.env') or p.name=='.DS_Store' or p.name.startswith('.jupyterlite') or p.name.endswith('.map'):continue
  rel=p.relative_to(root)
  if rel.parts[0]=='dist':
   shared=root/'public'/Path(*rel.parts[1:])
   if shared.is_file() and p.stat().st_size==shared.stat().st_size and hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(shared.read_bytes()).digest():continue
  z.write(p,'fintech-algorithms/'+str(rel))
print(str(out));print('ZIP:',round(out.stat().st_size/1024/1024,1),'MiB')
`;
const result = spawnSync('python3', ['-c', code], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
