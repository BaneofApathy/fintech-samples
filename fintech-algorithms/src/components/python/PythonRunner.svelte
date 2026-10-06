<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import { read, response, download, recordActivity } from '../../engine/progress';
  import LabComparison from '../visuals/LabComparison.svelte';
  import {
    labPresentation,
    withDataPreview,
    parseRun,
    hasRunError,
    formatMetric,
    type LabEdit,
    type RunSnapshot,
  } from './lab-presentation';
  let {
    code,
    edits = [],
    slug,
    metric,
  }: { code: string; edits?: LabEdit[]; slug: string; metric: string } = $props();
  let source = $state(untrack(() => code));
  let phase = $state<'ready' | 'loading' | 'running' | 'complete' | 'stopped' | 'failed'>('ready');
  let status = $state('Ready to run.');
  let baseline = $state<RunSnapshot | null>(null);
  let current = $state<RunSnapshot | null>(null);
  let diagnostic = $state('');
  let editNote = $state('');
  let worker: Worker | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let runId = 0;
  const busy = $derived(phase === 'loading' || phase === 'running');
  const presentation = $derived(labPresentation[slug]);
  const latest = $derived(current ?? baseline);
  const preview = $derived(latest?.preview ?? presentation?.preview);
  function rememberActivity(action: string) {
    const title =
      document.querySelector('main h1')?.textContent?.trim() ?? slug.replaceAll('-', ' ');
    recordActivity({
      id: `${slug}:code`,
      href: `${window.location.pathname}${window.location.search}#run`,
      title: `${title} · Python lab · ${action}`,
    });
  }
  function saveCode(value: string) {
    response(slug + ':code', value);
    rememberActivity('Edit code');
  }
  const comparisonRows = $derived.by(() => {
    const labels = [
      ...new Set([
        ...(baseline?.metrics.map((m) => m.label) ?? []),
        ...(current?.metrics.map((m) => m.label) ?? []),
      ]),
    ];
    return labels.map((label) => ({
      label,
      baseline: baseline?.metrics.find((m) => m.label === label),
      current: current?.metrics.find((m) => m.label === label),
    }));
  });
  onMount(() => {
    source = read().answers[slug + ':code'] ?? code;
  });
  onDestroy(() => {
    runId++;
    worker?.terminate();
    clearTimer();
  });
  function clearTimer() {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  }
  function fail(message: string) {
    runId++;
    clearTimer();
    worker?.terminate();
    worker = null;
    phase = 'failed';
    diagnostic = message;
    status = 'Run failed. Your code edits and any previous successful results are preserved.';
  }
  function run(kind: 'baseline' | 'current') {
    if (busy) return;
    rememberActivity(kind === 'baseline' ? 'Run baseline' : 'Run your changes');
    const activeId = ++runId;
    phase = worker ? 'running' : 'loading';
    status =
      kind === 'baseline'
        ? 'Starting baseline…'
        : 'Starting edited code…';
    diagnostic = '';
    try {
      if (!worker) worker = new Worker(`${import.meta.env.BASE_URL}python/runner-worker.js`);
      worker.onmessage = (event) => {
        if (activeId !== runId) return;
        if (event.data.type === 'status') {
          phase = event.data.text.startsWith('Running') ? 'running' : 'loading';
          status = event.data.text;
          return;
        }
        clearTimer();
        const result = parseRun(
          slug,
          event.data.stdout ?? '',
          event.data.stderr ?? '',
          event.data.figures ?? [],
        );
        if (hasRunError(result.stderr)) {
          fail([result.stderr, result.stdout].filter(Boolean).join('\n\n'));
          return;
        }
        if (kind === 'baseline') baseline = result;
        else current = result;
        phase = 'complete';
        status = `${kind === 'baseline' ? 'Original baseline' : 'Your edited example'} complete.${result.stderr ? ' See runtime notes in the full output.' : ''}`;
      };
      worker.onerror = (event) => {
        if (activeId === runId)
          fail(
            event.message ||
              'Python could not start. Try again, or download the notebook for a Python environment.',
          );
      };
      worker.postMessage({ code: withDataPreview(kind === 'baseline' ? code : source, slug) });
      timeout = setTimeout(() => {
        if (activeId !== runId) return;
        stop(false);
        status =
          'Run stopped after 60 seconds. Reduce the sample size or training iterations, then try again. Previous successful results are retained.';
      }, 60000);
    } catch (error) {
      fail(String(error));
    }
  }
  function stop(userAction = true) {
    runId++;
    worker?.terminate();
    worker = null;
    clearTimer();
    phase = 'stopped';
    status = 'Run stopped. Your edits and any previous successful results are preserved.';
    if (userAction) rememberActivity('Run stopped');
  }
  function edit(item: LabEdit) {
    if (!source.includes(item.find)) {
      editNote = 'Reset the example before applying this edit.';
      return;
    }
    source = source.replace(item.find, item.replace);
    saveCode(source);
    editNote = `Applied: ${item.label}. ${item.description || 'Run your changes to compare with the original baseline.'}`;
  }
</script>

<section class="guided-lab" aria-label="Python experiment">
  <h3>{presentation?.question ?? 'What changes when you modify this baseline?'}</h3>
  <p class="lab-instruction">
    Run the starter code, change one setting, and compare the measures. “Original baseline” refers
    to the starter code. A model baseline is a separate comparison, such as a constant prediction or
    equal-weight portfolio.
  </p>
  {#if preview}
    <div class="data-preview">
      <p class="preview-caption">
        <strong
          >{latest?.preview
            ? 'Inputs from the latest successful run'
            : 'Inputs'}</strong
        ><br />{preview.caption}
      </p>
      <div class="table-scroll">
        <table>
          <thead
            ><tr
              >{#each preview.columns as column}<th scope="col">{column}</th>{/each}</tr
            ></thead
          ><tbody
            >{#each preview.rows as row}<tr
                >{#each row as value}<td>{value}</td>{/each}</tr
              >{/each}</tbody
          >
        </table>
      </div>
    </div>
  {/if}
  <div class="lab-run-actions button-row">
    <button class="button" onclick={() => run(baseline ? 'current' : 'baseline')} disabled={busy}
      >{busy
        ? phase === 'loading'
          ? 'Loading Python…'
          : 'Running…'
        : baseline
          ? 'Run your changes'
          : 'Run baseline'}</button
    >
    {#if busy}<button class="button secondary" onclick={() => stop()}>Stop run</button
      >{:else if baseline}<button class="button quiet" onclick={() => run('baseline')}
        >Rerun original baseline</button
      >{/if}
  </div>
  <p class="status-line" role="status" aria-live="polite" data-run-state={phase}>{status}</p>
  {#if !baseline && source !== code}<p class="small muted">
      “Run baseline” runs the starter code first. Then run your edits to compare results.
    </p>{/if}
  {#if diagnostic}<div class="run-diagnostic" role="alert">
      <strong>Run failed</strong>
      <pre>{diagnostic}</pre>
      <p class="small">
        Check the reported line, then try again. You can also download your code or open the
        notebook.
      </p>
    </div>{/if}
  {#if latest}
    <section class="lab-results" aria-label="Lab results">
      <h4>
        {phase === 'failed' || phase === 'stopped' || busy
          ? 'Previous successful results'
          : 'Compare results'}
      </h4>
      <p class="small muted">
        Compare the starter code with your latest run of the edited code.
      </p>
      {#if comparisonRows.length}
        {#if baseline && current}<LabComparison rows={comparisonRows} />{/if}
        <div class="table-scroll">
          <table class="comparison-table">
            <thead
              ><tr
                ><th scope="col">Measure</th><th scope="col">Original baseline</th><th scope="col"
                  >Your latest run</th
                ></tr
              ></thead
            ><tbody
              >{#each comparisonRows.slice(0, 3) as row}<tr
                  ><th scope="row"
                    >{row.label}<small
                      >{(row.current ?? row.baseline)?.direction === 'higher'
                        ? 'Higher is better for this measure'
                        : (row.current ?? row.baseline)?.direction === 'lower'
                          ? 'Lower is better for this measure'
                          : 'Interpret in context'}</small
                    ></th
                  ><td>{row.baseline ? formatMetric(row.baseline.value) : '—'}</td><td
                    >{row.current
                      ? formatMetric(row.current.value)
                      : 'Run your changes to compare'}</td
                  ></tr
                >{/each}</tbody
            >
          </table>
        </div>
        {#if comparisonRows.length > 3}<details class="extra-metrics">
            <summary>More measures</summary>
            <div class="table-scroll">
              <table>
                <thead
                  ><tr
                    ><th scope="col">Measure</th><th scope="col">Original baseline</th><th
                      scope="col">Your latest run</th
                    ></tr
                  ></thead
                ><tbody
                  >{#each comparisonRows.slice(3) as row}<tr
                      ><th scope="row">{row.label}</th><td
                        >{row.baseline ? formatMetric(row.baseline.value) : '—'}</td
                      ><td>{row.current ? formatMetric(row.current.value) : '—'}</td></tr
                    >{/each}</tbody
                >
              </table>
            </div>
          </details>{/if}
      {:else}<p>
          No labeled numeric measures were found. Read the full output below to inspect this run.
        </p>{/if}
      {#if presentation}<p class="result-interpretation">
          <strong>How to read this:</strong>
          {presentation.interpretation}
        </p>{/if}
      <p class="reflection">
        <strong>Explain the result:</strong> What changed, what stayed fixed, and is the change enough
        to alter a financial decision?
      </p>
      <details class="full-output">
        <summary>Full output and runtime notes</summary>
        {#if baseline}<h5>Original baseline</h5>
          <div class="code-output">
            <pre>{baseline.stdout}</pre>
            {#if baseline.stderr}<pre
                class="runtime-note">{baseline.stderr}</pre>{/if}{#each baseline.figures as figure, i}<img
                src={figure}
                alt={`Original baseline plot ${i + 1} for ${slug}`}
              />{/each}
          </div>{/if}
        {#if current}<h5>Your latest successful run</h5>
          <div class="code-output">
            <pre>{current.stdout}</pre>
            {#if current.stderr}<pre
                class="runtime-note">{current.stderr}</pre>{/if}{#each current.figures as figure, i}<img
                src={figure}
                alt={`Latest successful run plot ${i + 1} for ${slug}`}
              />{/each}
          </div>{/if}
      </details>
    </section>
  {/if}
  <div class="code-cell">
    <details class="code-editor">
      <summary
        >View and edit code <span class="editor-meta">{slug}.py · Primary measure: {metric}</span
        ></summary
      >
      <p class="editor-guidance">
        Change one setting, keep the data and split fixed, then run your changes. Add a validation
        split before repeatedly tuning settings; preserve the final test set for evaluation.
      </p>
      <textarea
        aria-label={`Python code for ${slug}`}
        spellcheck="false"
        bind:value={source}
        oninput={(event) => saveCode(event.currentTarget.value)}></textarea>
      <div class="code-edits">
        {#each edits as item}<button
            class="button secondary"
            title={item.description}
            onclick={() => edit(item)}
            disabled={busy}>{item.label}</button
          >{/each}
      </div>
      {#if editNote}<p class="edit-note" role="status">{editNote}</p>{/if}
      <div class="editor-actions button-row">
        <button
          class="button quiet"
          onclick={() => {
            source = code;
            saveCode(code);
            editNote = 'Original code restored. Comparison results remain available.';
          }}
          disabled={busy}>Reset code</button
        ><button
          class="button quiet"
          onclick={() => download(`${slug}.py`, source, 'text/x-python')}>Download code</button
        >
      </div>
    </details>
  </div>
  {#if slug === 'transformers' || slug === 'rag'}<p class="native-disclosure">
      This lab uses a {slug === 'transformers'
        ? 'TF-IDF linear sentiment baseline'
        : 'TF-IDF retrieval baseline'}. The {slug === 'transformers'
        ? 'pretrained FinBERT'
        : 'Sentence-Transformers'} example requires native Python.
      <a href={`${import.meta.env.BASE_URL}notebooks/native/${slug}.py`} download
        >Download the native Python example</a
      >.
    </p>{/if}
</section>

<style>
  .guided-lab {
    min-width: 0;
  }
  .guided-lab h3 {
    font-size: 1.4rem;
    line-height: 1.4;
    margin: 0 0 0.7rem;
    max-width: 44rem;
  }
  .lab-instruction,
  .preview-caption,
  .native-disclosure,
  .editor-guidance,
  .edit-note {
    font-size: 0.875rem;
    line-height: 1.65;
    color: var(--muted);
  }
  .data-preview {
    margin: 1.25rem 0;
  }
  .preview-caption {
    margin-bottom: 0.4rem;
  }
  .preview-caption strong {
    color: var(--ink);
  }
  .lab-run-actions {
    margin: 1.25rem 0 0.5rem;
  }
  .lab-results {
    padding: 1.1rem 0;
    margin: 1.5rem 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .lab-results h4 {
    margin: 0;
    font-size: 1.15rem;
  }
  .comparison-table th[scope='row'] {
    color: var(--ink);
    font-size: 0.875rem;
  }
  .comparison-table small {
    display: block;
    font-weight: 400;
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }
  .comparison-table td {
    font-variant-numeric: tabular-nums;
  }
  .result-interpretation,
  .reflection {
    font-size: 0.9rem;
    line-height: 1.7;
    max-width: 68ch;
  }
  .reflection {
    color: var(--green);
  }
  summary {
    cursor: pointer;
    padding: 0.85rem 0;
    min-height: 44px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .code-editor summary {
    padding: 1rem;
  }
  .editor-meta {
    display: block;
    margin-top: 0.3rem;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 400;
    overflow-wrap: anywhere;
  }
  .editor-guidance,
  .edit-note {
    padding: 0 1rem;
  }
  .editor-actions {
    padding: 0 1rem 1rem;
  }
  .code-cell {
    max-width: 100%;
  }
  .code-cell textarea {
    min-height: 320px;
  }
  .code-output pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .code-output {
    max-width: 100%;
  }
  .run-diagnostic {
    border-left: 3px solid var(--warning);
    background: var(--warning-bg);
    padding: 1rem;
    margin: 1rem 0;
  }
  .run-diagnostic pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 0.8rem;
    max-height: 16rem;
    overflow: auto;
  }
  .runtime-note {
    color: var(--warning);
    margin-top: 1rem;
  }
  .native-disclosure {
    margin-top: 1.2rem;
  }
  button {
    min-height: 44px;
  }
  @media (max-width: 600px) {
    th,
    td {
      font-size: 0.8rem;
      padding: 0.55rem 0.35rem;
    }
    .guided-lab h3 {
      font-size: 1.2rem;
    }
    .comparison-table small {
      font-size: 0.7rem;
    }
  }
</style>
