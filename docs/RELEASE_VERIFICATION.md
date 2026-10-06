# Publication verification

Release prepared on 6 October 2026 from the instructor's local course applications. Only the two selected reference projects and public contribution documentation were imported into the existing repository.

## Algorithms

- Frozen dependency installation completed with Node 24.19.0 and pnpm 11.25.0.
- Content validation passed: 12 algorithms, 39 measures, 64 exercises, 61 teaching topics, 319 lessons, and 732 explained questions.
- Astro diagnostics reported zero errors; svelte-check reported zero errors and zero warnings. Existing informational hints remain.
- Production build and Pagefind indexing completed. The optional offline inventory contains 1,663 files and approximately 116.9 MiB before transfer compression.
- All 756 unit tests passed in 22 files, including explicit preparation, interrupted download, retention of the previous complete cache, retry, and removal behavior.
- Initial browser run: 279 passed; 22 failed because the tests expected former feedback labels or an outdated guided activity ID. No application teaching behavior was changed to resolve those stale assertions. All 30 tests in the three affected browser files passed on the targeted rerun, covering all 22 initial failures.
- The new browser check passed: an ordinary first visit made no Python/notebook runtime requests; explicit preparation completed; a lesson reloaded offline; removal cleared course caches while preserving browser progress.
- All 12 notebook examples executed offline and printed their expected primary metrics. Notebook reload and return to the course also passed offline.

## Payment Rails

- All 22 Python tests passed, including financial rules, exact fee arithmetic, six-process integration, HTTP commands, launcher startup, and shutdown.
- The static guide and source ZIP built successfully.
- Desktop (1,440 px) and mobile (390 px) checks passed: local links, anchors, PDF/source downloads, axe accessibility, no horizontal overflow, and no browser errors.
- Screenshots and both PDFs were reviewed. The documents contain 10 and 20 pages; PDF metadata identifies the course, with no student author fields.
- The $50 example shows a $50 authorization hold, a $450 posted balance after clearing, and $48.75 merchant proceeds after $1.25 in illustrative fees.

## Publication privacy

- Private course folders, individual assignment packets, raw authoring sources, caches, dependencies, generated QA, and old distributions are excluded.
- A private roster comparison found zero known student-name matches in the selected source files and PDF text. The comparison list is not published.
- Selected screenshots contain fictional demonstration accounts only. Course data, examples, and payment fixtures are fictional; no learner progress, student records, or real financial records are included.
- Source and deployment inventories passed the publication checker. The bundled scientific runtime, including Python's standard-library ZIP, is retained; third-party notices remain intact.
- Instructor authorship and existing license notices are preserved. Public GitHub account identities and commit metadata remain visible.

CI re-runs the complete browser suite and project checks for the published branch. Deployment URLs and final CI outcomes are verified separately before production release.
