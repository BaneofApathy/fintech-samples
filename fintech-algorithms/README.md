# Fintech Algorithms

A complete, local-first reference app independently created by instructor Adnan Masood, PhD. for USF AI in Fintech lectures, covering **AI in Fintech: 12 Algorithms Every Student Should Know**. This is not an official repository of the University of South Florida.

## Open the app

1. Extract the whole ZIP into one folder.
2. Open a terminal in `fintech-algorithms`.
3. Run **`python3 start.py`** (Windows: `py -3 start.py`, or double-click `start_windows.bat`).
4. Open **http://localhost:8000**. Keep the terminal open while using the app.

The ZIP already contains the built app. Python 3.9 or later is the only requirement for this launch method. If Node is installed instead, run `node start.mjs`. On macOS, `start_macos.command` runs the same Python launcher; the terminal command also works.

Use a recent Chrome, Edge, Firefox, or Safari browser. Serve through the launcher; opening an HTML file directly does not support JavaScript modules, WebAssembly, notebooks, or offline caching. A different port can be selected with `python3 start.py --port 8080`.

Online visits load only what you use. Choose **Make available offline** near the bottom of a course page to download the complete course, search, browser Python packages, and notebooks. The control shows the actual size and progress. An interrupted download can be retried; the previous complete copy remains available during updates. **Remove offline copy** clears course caches and preserves learning progress. Browser storage eviction may remove an offline copy.

## What is included

- **319 short teaching lessons** across all 12 algorithms, 39 measure topics, and ten selectable foundations. Definitions precede the explorers; lessons explain terminology, mathematical mechanisms, intermediate arithmetic, financial interpretation, and limitations.
- **732 explained multiple-choice questions** with guided, independent, and review questions for every learning objective. Each choice has feedback; saved sessions retain shuffled choices, selections, hints, and retries. Eight-question checkpoints cover definitions, mechanisms, calculation, and financial application equally.
- Detailed algorithm pseudocode, code walkthroughs, training versus prediction, computational costs, and extended derivations; grouped measure topics teach each constituent separately.
- A conceptual glossary with small examples and direct lesson links, plus the original context-specific symbol lookup.
- **Learn**, **Library**, and **My progress**, with exact lesson/question resume, missed-objective review, separate conceptual and numerical progress, and optional prerequisite lessons.
- 12 algorithm units, each with Problem, Intuition, Formula, Worked example, Practice, Measures, and Build & defend.
- 39 evaluation measures with symmetric links to the algorithms that use them.
- 12 guided algorithm diagrams, 39 dedicated measure visuals with separate bundled-measure views, and 11 interactive foundations concepts. Each starts with a financial question, a labeled example, controls, and a takeaway.
- **Financial problems**: 96 separately authored application storyboards, searchable at `/financial-problems/` and from the Library. The same financial topic has a different treatment under each algorithm.
- All **64 original exercises**, step checking, guided hints, contextual feedback, cell answers, seeded variants, and the original worked arithmetic.
- Every exercise links to its concept and can illustrate its current givens and calculation step. Viewing a practice illustration records assistance without completing an answer. S01–S04 include parsing, completeness, unfinished execution, and execution-tail diagrams.
- 18 guided SVG explorers with focused questions, baseline comparisons, keyboard controls, numeric inputs, and optional advanced settings/results.
- Server-rendered KaTeX with MathML, complete local symbol meanings, and keyboard/tap tooltips.
- 12 editable Python examples with input previews, original-baseline comparisons, and failure recovery; local Pyodide, pinned scientific packages, prepared notebooks, and a bundled JupyterLite workspace.
- Local resume, sections read, separate assisted/independent answers, checkpoints, saved partial numerical inputs, saved defense responses, capstone recommendation export, JSON import/export, and separate conceptual/calculation attempt CSV exports. Existing version 1 progress files remain compatible.
- Instructor solution controls, per-problem timers, a 40-minute classroom sequence, Reveal.js presentations, dark mode, and printable handouts.
- Pagefind search across the complete local course.
- Capstone method selection, a saved-response evidence chain, failure inspection, and printable/downloadable diagrams with the learner's evidence. Case data are bundled as static JSON; no backend or external model is required.
- Application source, generated YAML content, numerical contracts, tests, and Vercel deployment configuration.

New visitors start in light mode; saved light/dark preferences are retained. On phones, the current lesson section is a selector rather than a horizontal tab strip. Build & defend separates Run & compare, Check understanding, and Defend your decision.

## Source fidelity and adaptations

The course includes 64 exercises, including suffixed IDs for measures 11, 17, 27, 29, 32, and 39. The examples, formulas, and explanations needed to complete them are included in the app.

The two pretrained examples have an explicit browser constraint: PyTorch, pretrained FinBERT, and Sentence-Transformers are unavailable in the specified Pyodide stack. Those two offline cells are clearly labelled **TF-IDF baselines**. Native Python examples are included as downloads. This app does not present baseline results as pretrained-model results.

Some scientific examples use smaller teaching samples and fewer training iterations for browser execution. Datasets are fixed by values and random seeds. Changes, package pins, conventions, and rounding are documented in the project source. Explorers use compact examples: the attention explorer has two tokens and the retrieval explorer has three document vectors.

All student data stays in this browser's localStorage and notebook storage. Export progress before changing machines. Import replaces the local progress record. Accounts, gradebook integrations, and the optional API tutor are outside the requested local app; no remote student-data service is configured.

## Develop

Requires Node 22.12 or later and pnpm 11.25.0.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The dev server is at the address printed by Astro. Search and offline caching are available after a production build.

```sh
pnpm validate
pnpm test
pnpm check
pnpm build
python3 start.py
```

Generated course records are committed; the private authoring PDF is not needed for development. `metadata/` preserves reviewed formula records, source-defense checks, and Python dependency pins. `python3 scripts/build-labs.py` rebuilds notebooks; `pnpm vendor:python` refreshes the pinned runtime.

For browser checks:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

`pnpm build:offline` builds and packages `artifacts/USF_Fintech_Algorithms_App.zip`. The ZIP deduplicates shared static assets: launchers serve generated pages from `dist/` and shared assets from `public/`. Do not move either folder away from the application root.

## Optional Vercel deployment

For a future hosting release, configure the Vercel project root as `fintech-algorithms`, Node 24, install command `pnpm install --frozen-lockfile`, build command `pnpm build`, and output directory `dist`. Deployment is static; no API key, database, or learner-data backend is required.

For a different domain, set `SITE_URL` to the production URL and keep `BASE_PATH=/`. Run validation, tests, checks, and the production build before publishing. Repository-level CI runs these checks from the application directory.

## Project map

| Folder | Purpose |
|---|---|
| `content/` | Original-source YAML and numerical contracts |
| `src/pages/` | Static course, measure, and presentation routes |
| `src/components/` | Shared layouts, learning activities, and Svelte explorers |
| `src/engine/` | Solvers, variants, answer checking, feedback, and local progress |
| `labs/` | Prepared Python notebooks and standalone code |
| `public/python/` | Pinned local WebAssembly runtime and scientific packages |
| `public/labs/` | Bundled JupyterLite application |
| `metadata/` | Sanitized source checks and dependency pins |
| `scripts/` | Validation, vendoring, build, and packaging |
| `tests/` | Golden numerical checks and browser flows |
| `qa/` | Generated verification output; excluded from Git |

## Rights and attribution

Prepared independently by Adnan Masood, PhD. as instructor-created reference material for USF AI in Fintech lectures. This is not an official repository of the University of South Florida. The reference material is licensed under [Creative Commons CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Third-party open-source components retain their own licenses; see `THIRD_PARTY_NOTICES.md` and the bundled package metadata.
