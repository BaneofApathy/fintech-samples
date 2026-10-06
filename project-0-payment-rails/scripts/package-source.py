"""Build a source download from an explicit public-file inventory."""
from pathlib import Path
import zipfile
root = Path.cwd()
folders = ['simulator', 'web', 'data', 'tests', 'docs', 'screenshots']
files = ['README.md', 'AI_USAGE.md', 'TEST_REPORT.md', 'Dockerfile', '.dockerignore', 'start.py', 'start_windows.bat', 'start_macos.command']
with zipfile.ZipFile(root/'site-dist/downloads/payment-rails-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    inventory = [root/name for name in files]
    inventory += [p for name in folders for p in (root/name).rglob('*') if p.is_file()]
    for p in sorted(inventory):
        rel = p.relative_to(root)
        if any(part in {'qa', '__pycache__', '.git', '.venv'} for part in rel.parts) or p.suffix in {'.pyc', '.aux', '.log', '.out'} or p.name == '.DS_Store':
            continue
        archive.write(p, 'project-0-payment-rails/' + rel.as_posix())
print('Created sanitized Payment Rails source ZIP.')
