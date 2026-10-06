<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import CaseVisual from './cases/CaseVisual.svelte';
  import type { FinancialCase } from '../../data/financial-cases/types';
  import VisualFrame from './VisualFrame.svelte';
  import { read, response, download } from '../../engine/progress';
  import { visualHref } from '../../data/visual-links';
  type Method = {
    slug: string;
    title: string;
    question: string;
    baseline: string;
    measures: { slug: string; title: string }[];
  };
  type Case = {
    title: string;
    href: string;
    algorithmSlug: string;
    question: string;
    visualId: string;
  };
  let {
    methods,
    cases,
    questions,
    initialCase,
  }: { methods: Method[]; cases: Case[]; questions: string[]; initialCase: FinancialCase } =
    $props();
  let scenario = $state<FinancialCase>(untrack(() => initialCase)),
    loading = $state(false),
    loadError = $state(''),
    caseElement: HTMLDivElement;
  let methodIndex = $state(0),
    caseIndex = $state(0),
    active = $state(0),
    failure = $state(0),
    reveal = $state(false),
    reflection = $state('');
  let saved = $state<Record<string, string>>({});
  const method = $derived(methods[methodIndex]);
  const choices = $derived(cases.filter((c) => c.algorithmSlug === method.slug));
  const selected = $derived(choices[caseIndex] ?? choices[0]);
  $effect(() => {
    const id = selected?.visualId;
    if (!id || id === untrack(() => scenario.visualId)) return;
    const controller = new AbortController();
    loading = true;
    loadError = '';
    fetch(visualHref(`/visual-data/${id}.json`), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('unavailable');
        return r.json();
      })
      .then((data) => {
        scenario = data;
        loading = false;
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          loading = false;
          loadError =
            'This case could not load. Open the linked lesson or reload the page.';
        }
      });
    return () => controller.abort();
  });
  const nodes = [
    { label: 'Decision', question: 0 },
    { label: 'Known data', question: 1 },
    { label: 'Baseline', question: 2 },
    { label: 'Model', question: 2 },
    { label: 'Evaluation', question: 3 },
    { label: 'Consequence & control', question: 5 },
    { label: 'Monitoring', question: 6 },
    { label: 'Stop condition', question: 7 },
  ];
  const failures = [
    {
      label: 'Future information',
      node: 1,
      problem: 'A feature was collected after the decision it is supposed to inform.',
      control:
        'Rebuild the data using the decision-time cutoff, then repeat evaluation on untouched later observations.',
    },
    {
      label: 'Missing evidence',
      node: 4,
      problem: 'The answer cites a document but a required fact is absent.',
      control:
        'Require support for every requested component and abstain or request the missing source.',
    },
    {
      label: 'Rare events hidden by accuracy',
      node: 4,
      problem: 'The model passes almost every legitimate case but misses the rare costly outcome.',
      control:
        'Inspect the confusion matrix, recall, review capacity, and explicit decision costs against a baseline.',
    },
    {
      label: 'Shifted population',
      node: 6,
      problem: 'The current applicants differ from the population used to evaluate the model.',
      control:
        'Investigate changed inputs and obtain recent outcome evidence before assuming the old performance still holds.',
    },
    {
      label: 'Infeasible allocation',
      node: 5,
      problem: 'The proposed weights cannot satisfy every mandatory constraint.',
      control:
        'Report infeasibility and ask the decision owner to revisit the constraints; do not quietly present an invalid solution.',
    },
    {
      label: 'Unfinished execution',
      node: 5,
      problem:
        'The policy reports low paid cost while leaving part of the required order unfilled.',
      control:
        'Include completion and opportunity cost under the same order requirement as the baseline.',
    },
    {
      label: 'Correlated losses',
      node: 3,
      problem:
        'The simulation assumes independent defaults even though a common shock can affect many borrowers.',
      control:
        'Stress a justified dependence assumption and compare reserve breaches and tail losses, not only the mean.',
    },
  ];
  onMount(() => {
    const sync = () => {
      saved = read().answers;
      reflection = saved['capstone:visual:reflection'] ?? '';
    };
    sync();
    window.addEventListener('course-progress', sync);
    return () => window.removeEventListener('course-progress', sync);
  });
  function openAnswer() {
    document.getElementById(`defense-capstone-${nodes[active].question}`)?.focus();
    document
      .getElementById(`defense-capstone-${nodes[active].question}`)
      ?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }
  const escape = (s: string) =>
    s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  function exportEvidence() {
    const boxes = nodes
      .map(
        (n, i) =>
          `<rect x="${15 + (i % 4) * 185}" y="${15 + Math.floor(i / 4) * 100}" width="170" height="76" rx="8" fill="#e8f3ec" stroke="#064d3b"/><text x="${100 + (i % 4) * 185}" y="${58 + Math.floor(i / 4) * 100}" text-anchor="middle" font-size="13">${escape(n.label)}</text>`,
      )
      .join('');
    const rendered = caseElement?.querySelector('svg');
    let caseSvg = '';
    if (rendered) {
      const clone = rendered.cloneNode(true) as SVGElement;
      const originals = [rendered, ...rendered.querySelectorAll('*')],
        copies = [clone, ...clone.querySelectorAll('*')];
      for (let i = 0; i < originals.length; i++) {
        const style = getComputedStyle(originals[i]);
        for (const property of [
          'fill',
          'fill-opacity',
          'stroke',
          'stroke-width',
          'stroke-dasharray',
          'font-size',
          'font-family',
        ])
          copies[i].setAttribute(property, style.getPropertyValue(property));
      }
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      caseSvg = clone.outerHTML;
    }
    const svg = `${caseSvg}<p>${escape(caseElement?.querySelector('.case-caption')?.textContent ?? '')}</p><p>${escape(caseElement?.querySelector('.case-result')?.textContent ?? '')}</p><h2>Decision and evidence chain</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 755 210" role="img" aria-label="Decision and evidence chain">${boxes}</svg>`;
    download(
      'fintech-visual-defense.html',
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>Financial decision evidence</title><style>body{font:16px/1.6 system-ui;max-width:850px;margin:2rem auto;padding:1rem;color:#172d25}svg{width:100%}section{break-inside:avoid}p{white-space:pre-wrap}h2{font-size:1.1rem}@media print{body{margin:0}}</style><h1>${escape(selected?.title ?? method.title)}</h1><p>Method: ${escape(method.title)}</p><p>Case: ${escape(selected?.href ?? method.slug)}. Written responses are ungraded.</p>${svg}<p><b>Baseline:</b> ${escape(method.baseline)}</p>${questions.map((q, i) => `<section><h2>${i + 1}. ${escape(q)}</h2><p>${escape(saved['capstone:defense:' + i] || 'No response yet.')}</p></section>`).join('')}<section><h2>Failure-case reflection</h2><p>${escape(reflection || 'No response yet.')}</p></section></html>`,
      'text/html',
    );
  }
  async function printEvidence() {
    await tick();
    window.print();
  }
</script>

<div class="synthesis-visual" data-synthesis-visual>
  <VisualFrame
    title="Choose a method from the financial question"
    question="What decision are you trying to improve, and what must the model beat?"
    takeaway="A useful method connects a financial decision to available data, a fair comparison, evidence, and a control."
  >
    <div class="method-map" role="group" aria-label="Financial questions">
      {#each methods as item, i}<button
          class:chosen={methodIndex === i}
          aria-pressed={methodIndex === i}
          onclick={() => {
            methodIndex = i;
            caseIndex = 0;
          }}
          ><span>{String(i + 1).padStart(2, '0')}</span><strong>{item.title}</strong><small
            >{item.question}</small
          ></button
        >{/each}
    </div>
    <div class="visual-controls">
      <label
        >Financial application<select bind:value={caseIndex}
          >{#each choices as item, i}<option value={i}>{item.title}</option>{/each}</select
        ></label
      >
    </div>
    <div class="visual-feedback">
      <strong>{selected?.title ?? method.title}</strong>
      <p>{selected?.question ?? method.question}</p>
      <p><b>Baseline:</b> {method.baseline}</p>
      {#if selected}<a href={visualHref(selected.href)}>Open this case diagram →</a>{/if}
    </div>
    <div class="visual-crosslinks">
      {#each method.measures.slice(0, 3) as m}<a href={visualHref(`/measures/${m.slug}/`)}
          >{m.title}</a
        >{/each}
    </div>
  </VisualFrame>
  <div bind:this={caseElement} class="selected-case" aria-busy={loading}>
    {#if loading}<p role="status">Loading the selected case diagram…</p>{:else if loadError}<p
        role="alert"
      >
        {loadError}
      </p>{:else}{#key scenario.visualId}<CaseVisual {scenario} />{/key}{/if}
  </div>
  <VisualFrame
    title="Connect the decision to its evidence"
    question="Can you explain every link in the chain?"
    takeaway="Check the decision, data, comparison, and controls against the evidence."
  >
    <div class="evidence-chain" role="group" aria-label="Decision and evidence chain">
      {#each nodes as node, i}<button
          aria-pressed={active === i}
          class:chosen={active === i}
          class:affected={reveal && failures[failure].node === i}
          onclick={() => (active = i)}
          ><span>{i + 1} →</span><strong>{node.label}</strong><small
            >{saved[`capstone:defense:${node.question}`]
              ? 'Response saved'
              : 'Response needed'}</small
          ></button
        >{/each}
    </div>
    <div class="visual-feedback">
      <strong>{questions[nodes[active].question]}</strong>
      <p class="saved-answer">
        {saved[`capstone:defense:${nodes[active].question}`] ||
          'No response yet.'}
      </p>
      <button class="button secondary" onclick={openAnswer}>Write or edit this response</button>
    </div>
    <div class="visual-controls">
      <label
        >Inspect a failure<select bind:value={failure} onchange={() => (reveal = false)}
          >{#each failures as item, i}<option value={i}>{item.label}</option>{/each}</select
        ></label
      ><button
        onclick={() => {
          reveal = !reveal;
          active = failures[failure].node;
        }}>{reveal ? 'Hide failure' : 'Reveal the failure'}</button
      >
    </div>
    {#if reveal}<div class="failure-card" aria-live="polite">
        <strong>{failures[failure].problem}</strong>
        <p>{failures[failure].control}</p>
      </div>{/if}
    <label class="reflection-label"
      >What evidence or control would change your recommendation?<textarea
        rows="3"
        value={reflection}
        oninput={(e) => response('capstone:visual:reflection', e.currentTarget.value)}
      ></textarea></label
    >
    <div class="visual-navigation">
      <button disabled={loading || !!loadError} onclick={exportEvidence}
        >Download diagram and saved evidence</button
      ><button disabled={loading || !!loadError} onclick={printEvidence}>Print evidence</button>
    </div>
    <div class="print-evidence">
      <h3>{selected?.title ?? method.title}</h3>
      <p>Example: {selected?.href ?? method.slug} · {method.baseline}</p>
      {#each questions as q, i}<h4>{q}</h4>
        <p>{saved[`capstone:defense:${i}`] || 'No response yet.'}</p>{/each}
      <h4>Failure-case reflection</h4>
      <p>{reflection || 'No response yet.'}</p>
    </div>
  </VisualFrame>
</div>

<style>
  .method-map {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
  }
  .method-map button,
  .evidence-chain button {
    min-width: 0;
    text-align: left;
    background: var(--canvas);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 0.8rem;
    color: var(--ink);
  }
  .method-map strong,
  .method-map small,
  .evidence-chain strong,
  .evidence-chain small {
    display: block;
  }
  .method-map span {
    font-size: 0.72rem;
    color: var(--green);
  }
  .method-map strong {
    font-size: 0.84rem;
  }
  .method-map small {
    font-size: 0.74rem;
    margin-top: 0.4rem;
    color: var(--muted);
  }
  .chosen {
    border: 2px solid var(--green) !important;
    background: var(--green-soft) !important;
  }
  .evidence-chain {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.7rem;
  }
  .evidence-chain span {
    font-size: 0.7rem;
    color: var(--green);
  }
  .evidence-chain strong {
    font-size: 0.82rem;
  }
  .evidence-chain small {
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.4rem;
  }
  .affected {
    outline: 3px dashed var(--warning);
    outline-offset: 1px;
  }
  .saved-answer {
    white-space: pre-wrap;
  }
  .failure-card {
    padding: 1rem;
    background: var(--warning-bg);
    border-left: 3px solid var(--warning);
    font-size: 0.87rem;
  }
  .reflection-label {
    display: grid;
    gap: 0.5rem;
    margin: 1rem 0;
    font-size: 0.87rem;
  }
  .reflection-label textarea {
    width: 100%;
  }
  .print-evidence {
    display: none;
  }
  @media (max-width: 600px) {
    .method-map,
    .evidence-chain {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media print {
    .method-map,
    .reflection-label {
      display: none;
    }
    .print-evidence {
      display: block;
    }
    .evidence-chain button {
      display: block !important;
    }
    .synthesis-visual :global(.visual-frame) {
      break-inside: auto;
    }
  }
</style>
