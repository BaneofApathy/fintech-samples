<script lang="ts">
  import { onMount } from 'svelte';
  import { read, response, download, recordActivity } from '../../engine/progress';
  import { defenseExamples } from './defense-examples';
  let {
    unit,
    questions,
    capstone = false,
  }: {
    unit: string;
    questions: { text: string }[];
    capstone?: boolean;
  } = $props();
  let answers = $state<Record<string, string>>({}),
    checks = $state<Record<string, boolean>>({});
  let saveStatus = $state('');
  const rubric = [
    'State the financial decision.',
    'Identify the required data and target.',
    'Explain the method in plain English.',
    'Implement a working baseline.',
    'Select an evaluation that matches the cost of error.',
    'Name the conditions under which the result should not be trusted.',
  ];
  const example = $derived(defenseExamples[unit] ?? defenseExamples.capstone);
  const key = (i: number) => `${unit}:defense:${i}`;
  onMount(() => {
    const p = read();
    questions.forEach((q, i) => (answers[key(i)] = p.answers[key(i)] || ''));
    rubric.forEach((q, i) => (checks[String(i)] = p.answers[`${unit}:rubric:${i}`] === 'true'));
    const storageFailed = () =>
      (saveStatus = 'This browser could not save the response. Export your work before leaving.');
    window.addEventListener('course-storage-error', storageFailed);
    return () => window.removeEventListener('course-storage-error', storageFailed);
  });
  function saveResponse(id: string, value: string) {
    saveStatus = 'Saved.';
    response(id, value);
    const title = capstone
      ? 'Capstone'
      : (document.querySelector('main h1')?.textContent?.trim() ?? unit.replaceAll('-', ' '));
    const index = Number(id.split(':').at(-1));
    recordActivity({
      id: `${unit}:defense`,
      href: `${window.location.pathname}${window.location.search}#defense`,
      title: `${title} · ${id.includes(':rubric:') ? 'Defense self-review' : `Written defense · Question ${index + 1}`}`,
    });
  }
  function exportAnswers() {
    download(
      `${unit}-defense.md`,
      questions
        .map((q, i) => `## ${i + 1}. ${q.text}\n\n${answers[key(i)] || '(No response yet)'}`)
        .join('\n\n'),
      'text/markdown',
    );
  }
</script>

<section id={capstone ? 'defense' : undefined}>
  <h2>{capstone ? 'Capstone defense' : 'Defend your decision'}</h2>
  <p class="muted">Explain your reasoning and use evidence from the example or your project.</p>
  <details class="annotated-example">
    <summary>Example response</summary>
    <p class="example-note">
      Use this structure with evidence from your own run.
    </p>
    <div class="reasoning-example">
      <span class="example-label">1 · Decision</span>
      <p>{example.decision}</p>
      <small>Names an action and the conditions that matter.</small>
    </div>
    <div class="reasoning-example">
      <span class="example-label">2 · Evidence</span>
      <p>{example.evidence}</p>
      <small
        >Identifies the comparison. In your answer, include your observed values and explain what
        they mean.</small
      >
    </div>
    <div class="reasoning-example">
      <span class="example-label">3 · Limit</span>
      <p>{example.limit}</p>
      <small>States a concrete reason the recommendation could fail.</small>
    </div>
    <p class="weak-example">
      <strong>A weak response:</strong> “The score is high, so this is the best method.” It leaves out
      the decision, comparison and limits.
    </p>
  </details>
  {#each questions as q, i}<div class="defense-response">
      <label for={`defense-${unit}-${i}`}>{i + 1}. {q.text}</label><textarea
        id={`defense-${unit}-${i}`}
        bind:value={answers[key(i)]}
        oninput={(e) => saveResponse(key(i), e.currentTarget.value)}></textarea>
    </div>{/each}
  {#if saveStatus}<p class="saved-note" role="status">{saveStatus}</p>{/if}
  <h3>Self-review</h3>
  <p class="muted small">
    Check each item your response addresses. This checklist does not grade your answer.
  </p>
  <div class="rubric">
    {#each rubric as item, i}<label
        ><input
          type="checkbox"
          bind:checked={checks[String(i)]}
          onchange={(e) => saveResponse(`${unit}:rubric:${i}`, String(e.currentTarget.checked))}
        />{item}</label
      >{/each}
  </div>
  <div class="button-row">
    <button class="button secondary" onclick={exportAnswers}>Export written responses</button>
  </div>
</section>

<style>
  .annotated-example {
    border: 1px solid var(--line);
    border-radius: 8px;
    margin: 1.25rem 0 1.75rem;
    padding: 0 1rem;
  }
  summary {
    cursor: pointer;
    padding: 1rem 0;
    min-height: 44px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .example-note,
  .weak-example {
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--muted);
  }
  .reasoning-example {
    padding: 0.8rem 0;
    border-top: 1px solid var(--line);
  }
  .example-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--green);
  }
  .reasoning-example p {
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0.35rem 0;
  }
  .reasoning-example small {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .weak-example {
    border-top: 1px solid var(--line);
    padding-top: 1rem;
  }
  .defense-response textarea {
    min-height: 140px;
    line-height: 1.7;
  }
  .rubric input {
    min-width: 18px;
    min-height: 18px;
  }
  .rubric label {
    padding: 0.75rem;
  }
  @media (max-width: 600px) {
    .rubric {
      grid-template-columns: 1fr;
    }
  }
</style>
