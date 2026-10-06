# Publication verification

Prepared on **6 October 2026** from the instructor's course applications. Only the two selected reference projects and public contribution documentation were imported into the existing repository. This release publishes the source and documentation to GitHub. Further Vercel release work was deferred at the instructor's request.

## Fintech Algorithms

| Check | Result |
|---|---|
| Reproducible installation | Frozen lock file; Node 24.19.0 and pnpm 11.25.0 |
| Teaching content | 12 algorithms, 39 measures, 64 exercises, 61 topics, 319 lessons, 732 explained questions |
| Types and components | Zero Astro errors; zero Svelte errors or warnings; existing informational hints remain |
| Production build | Static pages and Pagefind search built successfully |
| Unit tests | 756 passed in 22 files |
| Clean-checkout browser suite | 301 passed, including browser Python, search, navigation, saved progress, keyboard access, layouts, and offline preparation |
| Clean-checkout notebooks | All 12 examples executed and printed their primary metrics; offline reload and return to the course passed |

Ordinary visits do not download the complete course. The optional offline control exposes its download size, progress, retry, update, and removal behavior. Tests cover interrupted downloads, retention of the previous complete cache, successful retry, offline reload, and preservation of learner progress after removal. The complete optional inventory is approximately **116.9 MiB** before transfer compression.

Clean-checkout testing identified a required OpenBLAS ZIP excluded by an archive ignore rule. That library is now tracked with its upstream license. The publication check verifies that every pinned scientific package is present, staged or tracked, and matches its lock-file hash. Browser checks also cover narrow-screen text reflow and navigation controls when text is doubled; fixes retain the existing teaching and progress behavior.

## Payment Rails

| Check | Result |
|---|---|
| Python suite | 22 passed, including financial rules, exact fee arithmetic, six-process integration, HTTP commands, launcher startup, and shutdown |
| Static guide | Built successfully with the selected PDFs, diagrams, screenshots, and downloadable source ZIP |
| Desktop/mobile | Checked at 1,440 px and 390 px; no page overflow, serious automated accessibility findings, or browser errors |
| Links/downloads | Internal links, anchors, PDF downloads, images, and source download verified locally |
| Document review | All 30 pages across the two PDFs and the selected screenshots reviewed; metadata identifies the course |

The illustrative $50 purchase shows a $50 authorization hold, a $450 posted payer balance after clearing, and **$48.75 merchant proceeds** after $1.25 in demonstration fees. The hosted site is a guide; the unchanged Python simulator runs locally or in Docker. Project 0 remains an instructor reference with an unscored exploration checklist.

## Privacy and release controls

- Private course folders, individual assignment packets, raw authoring sources, caches, dependencies, local configuration, generated QA, and old distributions are excluded.
- A private roster comparison found no known student-name matches in the selected source files or PDF text. The comparison list is not published.
- Screenshots, notebook examples, course datasets, and payment fixtures contain fictional demonstration data. No learner progress, student records, grades, or real financial records are included.
- Source and deployment inventories passed the publication check. Required Python archives and component license notices are retained.
- Instructor authorship and the repository's existing license history are preserved. Public GitHub identities and commit metadata remain visible.

[Repository CI](https://github.com/adnanmasood/fintech-samples/actions/workflows/verify.yml) repeats content validation, type checks, unit tests, the full browser suite, notebook execution, Payment Rails tests, and publication checks. The full application verification suite passed in [GitHub CI](https://github.com/adnanmasood/fintech-samples/actions/runs/37541189906). Hosting verification is outside this GitHub release.
