<script lang="ts">
  import { onMount } from 'svelte';
  import { reviewLessonHref } from '../../engine/learning-navigation';
  import {
    empty,
    read,
    practiceSummary,
    importProgress,
    exportProgress,
    conceptAnalyticsCSV,
    analyticsCSV,
    type Progress,
  } from '../../engine/progress';
  import ContinueLearning from './ContinueLearning.svelte';
  import { assessmentSummary, reviewTopics, type PracticeTopic } from '../../engine/assessment';
  type Unit = { slug: string; title: string; description: string; exercises: string[] };
  let {
    units,
    base,
    topics = [],
  }: { units: Unit[]; base: string; topics?: PracticeTopic[] } = $props();
  let p = $state<Progress>(empty());
  let message = $state('');
  const sectionKeys = [
    'problem',
    'intuition',
    'formula',
    'worked',
    'practice',
    'measures',
    'defend',
  ];
  let summary = $derived(practiceSummary(p.attempts, p.helpUsed));
  let concepts = $derived(assessmentSummary(p, topics));
  let reviews = $derived(reviewTopics(p, topics));
  let sectionsRead = $derived(
    units.reduce(
      (total, u) => total + sectionKeys.filter((s) => p.sections[u.slug + ':' + s]).length,
      0,
    ),
  );
  onMount(() => {
    const update = () => (p = read());
    update();
    window.addEventListener('course-progress', update);
    return () => window.removeEventListener('course-progress', update);
  });
  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    try {
      const file = input.files?.[0];
      if (!file) return;
      importProgress(await file.text());
      message =
        'Progress imported, including saved written responses. This file replaced the progress on this device.';
    } catch (error) {
      message = error instanceof Error ? error.message : 'The progress file could not be imported.';
    }
    input.value = '';
  }
</script>

<ContinueLearning {units} {base} {topics} />
<div class="concept-statistics" aria-label="Conceptual learning progress">
  <div><strong>{concepts.attempted}</strong><span>Distinct conceptual questions checked</span></div>
  <div><strong>{concepts.independent}</strong><span>Independent conceptual answers</span></div>
  <div><strong>{concepts.assisted}</strong><span>Concepts practiced with help</span></div>
  <div><strong>{concepts.checkpointsPassed}</strong><span>Checkpoints passed</span></div>
</div>
{#if reviews.length}<section aria-label="Recommended review">
    <h2>Review the ideas you missed</h2>
    <div class="review-list">
      {#each reviews as review}<a
          href={reviewLessonHref(
            review.topic,
            review.summary.objectives.find((o) => o.needsReview)!.id,
            base,
          )}
          >{review.topic.title}<small
            >{review.summary.objectives
              .filter((o) => o.needsReview)
              .map((o) => o.title)
              .join(' · ')}</small
          ></a
        >{/each}
    </div>
  </section>{/if}
{#if p.resume}<p class="last-activity">
    Last lesson opened: {new Date(p.resume.time).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}. Opening a section does not mark it as read.
  </p>{/if}
<div class="learner-statistics" aria-label="Learning progress">
  <div>
    <strong>{sectionsRead}<small> / {units.length * 7}</small></strong><span
      >Sections marked read</span
    >
  </div>
  <div><strong>{summary.independent}</strong><span>Independent calculations</span></div>
  <div><strong>{summary.assisted}</strong><span>Calculations completed with help</span></div>
</div>
<h2>Measures and foundations</h2>
<div class="review-list">
  {#each topics.filter((t) => t.kind !== 'algorithm') as topic}{@const item = concepts.topics.find(
      (s) => s.topicId === topic.id,
    )!}<a href={`${base}${topic.kind === 'measure' ? 'measures/' : 'foundations/'}${topic.slug}/`}
      >{topic.title}<small
        >{item.attempted} questions checked · {item.independent} independent · {item.assisted} with help
        · {p.sections[topic.id] ? 'Read' : 'Reading in progress'}</small
      ></a
    >{/each}
</div>
<p class="progress-explanation">
  Answers are counted once per step and set of numbers. A hint or revealed solution makes that step
  assisted. Reading and answering measure different kinds of progress.
</p>
<h2>Your units</h2>
<div class="learner-units">
  {#each units as unit, index}
    {@const count = sectionKeys.filter((s) => p.sections[unit.slug + ':' + s]).length}
    {@const conceptual = concepts.topics.find((item) => item.topicId === 'algorithm:' + unit.slug)}
    {@const unitSummary = practiceSummary(
      p.attempts.filter((a) => unit.exercises.includes(a.id)),
      p.helpUsed,
    )}
    <article class="learner-unit">
      <div class="learner-unit-heading">
        <span class="outline-number">{index + 1}</span><a href={`${base}algorithms/${unit.slug}/`}
          >{unit.title}</a
        ><span>{count} of 7 read</span>
      </div>
      <progress max="7" value={count} aria-label={`${unit.title}: ${count} of 7 sections read`}
      ></progress>
      <div class="learner-unit-details">
        <span>{unitSummary.independent} independent · {unitSummary.assisted} assisted</span><span
          >Concept checkpoint: {conceptual?.checkpoint === undefined
            ? 'Not attempted'
            : Math.round(conceptual.checkpoint * 100) + '%'}</span
        >
        {#if p.checkpoints[unit.slug] !== undefined}<span
            >Legacy numerical checkpoint: {Math.round(p.checkpoints[unit.slug] * 100)}%</span
          >{/if}
      </div>
    </article>
  {/each}
</div>
<section class="progress-transfer" aria-labelledby="save-progress-title">
  <h2 id="save-progress-title">Keep a copy of your work</h2>
  <p>
    Progress and written responses are stored in this browser. Export a copy before moving to
    another device or clearing browser data.
  </p>
  <div class="button-row">
    <button class="button secondary" onclick={exportProgress}>Export progress JSON</button>
    <button class="button secondary" onclick={conceptAnalyticsCSV}
      >Export conceptual attempts CSV</button
    >
    <button class="button secondary" onclick={analyticsCSV}>Export calculation attempts CSV</button>
  </div>
  <details class="import-progress">
    <summary>Import an existing progress file</summary>
    <p class="small">
      Importing replaces the progress and responses currently on this device. Export a copy first if
      you want to keep both.
    </p>
    <label for="progress-file">Choose a progress JSON file</label><input
      id="progress-file"
      type="file"
      accept="application/json,.json"
      onchange={importFile}
    />
  </details>
  {#if message}<p role="status" class="import-message">{message}</p>{/if}
</section>
