"""Check the rendered course, excluding scripts and serialized component props."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.words = []
        self.links = []
        self.math_errors = 0
        self.course_page = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        self.course_page |= 'data-pagefind-body' in attrs
        if 'katex-error' in attrs.get('class', '').split():
            self.math_errors += 1
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if not self.skip:
            for attr in ('aria-label', 'aria-description', 'alt', 'title'):
                if attrs.get(attr):
                    self.words.append(attrs[attr])
    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip -= 1
    def handle_data(self, data):
        if not self.skip:
            self.words.append(data)

blocked = re.compile(
    r'next slides?|local slide|the source specifies|Read the local definition|'
    r'Source:\s*p\.|Choose\. Test\. Defend\.|every student should know|'
    r'Control to teach|Can the student|Follow the author|'
    r'Identify the inputs in the formula above|Use the local symbol key|'
    r'EVALUATION MEASURE \d+ OF 39|'
    r'Keep the denominator tied to the population|'
    r'Fixed, locally bundled classroom scenario|all amounts and policies are illustrative|'
    r'Locally bundled teaching example|Foundations · fixed, illustrative classroom examples|'
    r'See it · change it · explain it|Ready for offline use|Preparing offline|'
    r'Local progress · no account required|Learn one idea at a time|'
    r'Learn over several sessions|Progress saved on this device|'
    r'Your practice is saved on this device|Saved on this device|Your progress stays on this device|'
    r'Responses are stored on this device|Your recommendation is stored on this device|'
    r'Original numerical explorer|Supplied teaching extensions are labeled where introduced|'
    r'First, understand the concept|Take your time: explanations and practice are always available|'
    r'Calculation hint · explanation pending|'
    r'Changing a control explores a clearly indicated comparison|'
    r'\bAuthored\s+(?:M\d+|tiny|lending|financial|loan|customer|payments|settlement|'
    r'investigation|two-token|sentiment|vector|fictional|investment|first|second|buy-order|'
    r'exact|hand|lesson)\b', re.I)
failures = []
checked = []
for path in sorted(Path('dist').rglob('*.html')):
    page = Page()
    page.feed(path.read_text())
    if not page.course_page and 'instructor/present/' not in path.as_posix():
        continue
    checked.append(path.as_posix())
    text = ' '.join(' '.join(page.words).split())
    if page.math_errors:
        failures.append(f'{path}: {page.math_errors} broken formula(s)')
    for match in blocked.finditer(text):
        failures.append(f'{path}: {match.group()}')
    for link in page.links:
        if '/source/' in link or link.endswith('/deck.pdf'):
            failures.append(f'{path}: removed archive link {link}')
for removed in ('dist/source', 'public/source'):
    if Path(removed).exists():
        failures.append(f'Removed archive exists: {removed}')
if not checked:
    failures.append('No built course pages found')
report = {'pagesChecked': len(checked), 'failures': failures}
Path('qa').mkdir(exist_ok=True)
Path('qa/content-results.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(bool(failures))
