"""Check the proposed public inventory without storing private deny lists."""
from pathlib import Path
import argparse, re, subprocess, sys, zipfile
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--staged', action='store_true')
parser.add_argument('--dist', action='store_true')
args = parser.parse_args()
excluded = {'.git', 'node_modules', '.pnpm-store', '.astro', '.vercel', '.venv', '__pycache__', 'test-results', 'playwright-report', 'artifacts', 'qa', 'dist', 'site-dist'}
forbidden = {'source', 'Lecture 2', 'Lecture 3', 'Lecture 4', '.codex', '.agents', '.aws'}
if args.staged:
    names = subprocess.check_output(['git', 'diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], cwd=ROOT).decode().split('\0')
    files = [ROOT/n for n in names if n]
elif args.dist:
    files = [p for folder in ['fintech-algorithms/dist', 'project-0-payment-rails/site-dist'] for p in (ROOT/folder).rglob('*') if p.is_file()]
else:
    files = [p for p in ROOT.rglob('*') if p.is_file() and not any(x in excluded for x in p.relative_to(ROOT).parts)]
secrets = re.compile(r'(?<![A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
email = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
failures = []
text_types = {'.py', '.js', '.mjs', '.cjs', '.ts', '.svelte', '.astro', '.md', '.json', '.yaml', '.yml', '.html', '.css', '.tex', '.txt', '.svg', '.ipynb'}
for p in files:
    rel = p.relative_to(ROOT)
    if p.is_symlink() or any(x in forbidden for x in rel.parts): failures.append(f'{rel}: private path or symlink')
    if not args.dist and p.name != '.gitkeep' and (any(x in excluded for x in rel.parts) or p.name == '.DS_Store' or p.name.startswith('.env') and p.name != '.env.example'):
        failures.append(f'{rel}: generated or private artifact')
    if p.suffix in text_types:
        text = p.read_text(errors='replace')
        # Pinned vendor files retain their own public source examples and notices.
        vendor = any(x in rel.parts for x in ['python', 'licenses', 'labs']) and ('public' in rel.parts or args.dist)
        if not vendor and secrets.search(text): failures.append(f'{rel}: possible credential')
        if rel.parts[0] == 'student-projects' and email.search(text): failures.append(f'{rel}: email in student submission')
        if rel.parts[0] == 'student-projects' and re.search(r'/(?:Users|home)/[^/\s]+/', text): failures.append(f'{rel}: private local path')
    if args.dist and p.name == 'payment-rails-source.zip':
        with zipfile.ZipFile(p) as z:
            if any(any(x in excluded | forbidden for x in Path(n).parts) for n in z.namelist()): failures.append(f'{rel}: private archive member')
if failures:
    print('\n'.join(failures)); sys.exit(1)
print(f'Publication inventory passed: {len(files)} files. Human review of identities, screenshots, documents, and Git metadata is also required.')
