<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Exercise as ExerciseType, Givens, Value, Step } from '../../engine/types';
  import { solve } from '../../engine/solve/core';
  import { check, format } from '../../engine/check';
  import { feedback } from '../../engine/feedback';
  import { variant, cloneGivens } from '../../engine/variants';
  import {
    read,
    save,
    attempt,
    noteHelp,
    saveExerciseDraft,
    recordActivity,
    download,
  } from '../../engine/progress';
  import { exerciseSummary } from '../../engine/exercise-summary';
  import { resolveExplanation } from '../../engine/explanation-templates';
  import Timer from './Timer.svelte';
  import { exerciseVisualLinks, visualHref } from '../../data/visual-links';
  import Illustration from '../visuals/ExerciseVisual.svelte';
  let { exercise, practice = false }: { exercise: ExerciseType; practice?: boolean } = $props();
  let seed = $state(0),
    givens = $state<Givens>(untrack(() => cloneGivens(exercise.givens)));
  let follow = $state(untrack(() => !practice)),
    revealed = $state(false),
    instructor = $state(false),
    completed = $state<Record<string, boolean>>({});
  let answers = $state<Record<string, string>>({}),
    cellAnswers = $state<Record<string, string[]>>({}),
    fails = $state<Record<string, number>>({}),
    messages = $state<Record<string, { message: string; correct: boolean }>>({}),
    hints = $state<Record<string, number>>({}),
    wrongCells = $state<Record<string, number[]>>({}),
    shown = $state<Record<string, boolean>>({});
  let storageWarning = $state('');
  const solution = $derived(solve(exercise.id, givens));
  const learning = $derived.by(() => {
    if (!exercise.learning) throw new Error(`Missing authored learning copy for ${exercise.id}`);
    return exercise.learning;
  });
  const next = $derived(exercise.steps.findIndex((s) => !completed[s.id]));
  const finished = $derived(next === -1);
  function stepReason(step: Step): string {
    if (!step.explanation) return step.hints[0] ?? '';
    return resolveExplanation(
      step.explanation,
      `${exercise.id}:${step.id}`,
      exercise.labels,
      givens,
      solution,
      exercise.steps,
    );
  }
  const storageKey = $derived(`${exercise.id}:${practice ? 'practice' : 'worked'}`);
  const draftKey = $derived(`${storageKey}:${seed}`);
  const activityAnchor = $derived(`exercise-${exercise.id}-${practice ? 'practice' : 'worked'}`);
  function rememberActivity() {
    const index = exercise.steps.findIndex((step) => !completed[step.id]);
    const pending =
      index === -1 ? 'Calculation complete' : `Step ${index + 1}: ${exercise.steps[index].title}`;
    recordActivity({
      id: draftKey,
      href: `${window.location.pathname}${window.location.search}#${activityAnchor}`,
      title: `${exercise.id} · ${exercise.title} · ${pending}`,
    });
  }
  const visualLink = $derived(exerciseVisualLinks[exercise.id]);
  let visualOpen = $state(false),
    visualStep = $state('');
  function toggleVisual(event: Event) {
    visualOpen = (event.currentTarget as HTMLDetailsElement).open;
    if (!visualOpen) return;
    rememberActivity();
    if (practice)
      for (const step of exercise.steps) {
        shown[step.id] = true;
        noteHelp(exercise.id, seed, step.id);
      }
  }
  onMount(() => {
    const p = read();
    if (practice) {
      seed = p.seeds[storageKey] ?? 1;
      givens = variant(exercise.id, exercise.givens, seed);
      p.seeds[storageKey] = seed;
      save(p);
    }
    const done = p.exerciseSteps[exercise.id + ':' + seed] || [];
    completed = Object.fromEntries(done.map((k) => [k, true]));
    const draft = p.exerciseDrafts?.[draftKey];
    if (draft) {
      answers = { ...draft.answers };
      cellAnswers = Object.fromEntries(
        Object.entries(draft.cells).map(([id, cells]) => [id, [...cells]]),
      );
      // A saved answer belongs to input mode even when this is the original worked example.
      if (
        (Object.keys(draft.answers).length || Object.keys(draft.cells).length) &&
        exercise.steps.some((step) => !completed[step.id])
      )
        follow = false;
    }
    for (const step of p.helpUsed?.[exercise.id + ':' + seed] ?? []) shown[step] = true;
    for (const a of p.attempts.filter((a) => a.id === exercise.id && a.seed === seed)) {
      if (a.status === 'shown' || a.pattern === 'hint-used' || a.pattern === 'solution-viewed')
        shown[a.step] = true;
    }
    instructor = document.documentElement.dataset.instructor === 'true';
    if (instructor) follow = false;
    const listen = (e: Event) => {
      instructor = (e as CustomEvent<boolean>).detail;
      if (instructor) {
        follow = false;
        revealed = false;
      }
    };
    window.addEventListener('course-mode', listen);
    const storageFailed = () =>
      (storageWarning =
        'This browser could not save your draft. Keep this page open and export your work before leaving.');
    window.addEventListener('course-storage-error', storageFailed);
    return () => {
      window.removeEventListener('course-mode', listen);
      window.removeEventListener('course-storage-error', storageFailed);
    };
  });
  function submit(step: Step) {
    const expected = solution[step.id];
    const raw = Array.isArray(expected)
      ? (cellAnswers[step.id] ?? expected.map(() => ''))
      : (answers[step.id] ?? '');
    const result = check(raw, expected, step);
    wrongCells[step.id] = result.wrongCells;
    if (result.correct) {
      completed[step.id] = true;
      const assisted = !!hints[step.id] || !!shown[step.id];
      messages[step.id] = {
        message: assisted
          ? 'Correct with help. Try a fresh case to check your understanding.'
          : 'Correct. Use this result in the next step.',
        correct: true,
      };
      if (assisted) shown[step.id] = true;
      attempt({
        id: exercise.id,
        step: step.id,
        status: 'correct',
        seed,
        ...(assisted ? { pattern: hints[step.id] ? 'hint-used' : 'solution-viewed' } : {}),
      });
    } else {
      fails[step.id] = (fails[step.id] ?? 0) + 1;
      const f = feedback(exercise.id, step, result.value, expected, givens);
      messages[step.id] = { message: f.message, correct: false };
      attempt({ id: exercise.id, step: step.id, status: 'incorrect', pattern: f.pattern, seed });
    }
    rememberActivity();
  }
  function show(step: Step) {
    completed[step.id] = true;
    shown[step.id] = true;
    noteHelp(exercise.id, seed, step.id);
    attempt({ id: exercise.id, step: step.id, status: 'shown', seed });
    rememberActivity();
  }
  function toggleWorked() {
    if (follow) {
      // Reading a worked solution is useful learning, but is not independent practice.
      for (const step of exercise.steps) {
        shown[step.id] = true;
        noteHelp(exercise.id, seed, step.id);
      }
    }
    follow = !follow;
    rememberActivity();
  }
  function requestHint(step: Step) {
    hints[step.id] = Math.min((hints[step.id] ?? 0) + 1, step.hints.length);
    shown[step.id] = true;
    noteHelp(exercise.id, seed, step.id);
    rememberActivity();
  }
  function renew() {
    visualOpen = false;
    visualStep = '';
    seed++;
    givens = variant(exercise.id, exercise.givens, seed);
    completed = {};
    answers = {};
    cellAnswers = {};
    fails = {};
    messages = {};
    hints = {};
    shown = {};
    wrongCells = {};
    follow = false;
    const p = read();
    p.seeds[storageKey] = seed;
    save(p);
    rememberActivity();
  }
  function clear() {
    completed = {};
    answers = {};
    cellAnswers = {};
    fails = {};
    messages = {};
    hints = {};
    shown = {};
    wrongCells = {};
    const p = read();
    delete p.exerciseSteps[exercise.id + ':' + seed];
    if (p.exerciseDrafts) delete p.exerciseDrafts[draftKey];
    for (const step of p.helpUsed?.[exercise.id + ':' + seed] ?? []) shown[step] = true;
    for (const a of p.attempts.filter((a) => a.id === exercise.id && a.seed === seed)) {
      if (a.status === 'shown' || a.pattern === 'hint-used' || a.pattern === 'solution-viewed')
        shown[a.step] = true;
    }
    save(p);
    rememberActivity();
  }
  function cellChange(id: string, index: number, value: string, count: number) {
    const all = [...(cellAnswers[id] ?? Array.from({ length: count }, () => ''))];
    all[index] = value;
    cellAnswers[id] = all;
    saveExerciseDraft(draftKey, { answers, cells: cellAnswers });
    rememberActivity();
  }
  function answerChange(id: string, value: string) {
    answers[id] = value;
    saveExerciseDraft(draftKey, { answers, cells: cellAnswers });
    rememberActivity();
  }
  function exportDraft() {
    const p = read();
    p.exerciseDrafts ??= {};
    p.exerciseDrafts[draftKey] = {
      answers: { ...answers },
      cells: Object.fromEntries(Object.entries(cellAnswers).map(([id, cells]) => [id, [...cells]])),
    };
    p.helpUsed ??= {};
    p.helpUsed[exercise.id + ':' + seed] = [
      ...new Set([
        ...(p.helpUsed[exercise.id + ':' + seed] ?? []),
        ...Object.keys(shown).filter((id) => shown[id]),
      ]),
    ];
    download('fintech-progress-with-draft.json', JSON.stringify(p, null, 2));
  }
  function cellLabel(step: string, i: number) {
    return exercise.id === 'M01' && step === 'cells'
      ? ['True positives', 'False positives', 'False negatives', 'True negatives'][i]
      : `Cell ${i + 1}`;
  }
</script>

<section
  class="exercise-card"
  id={activityAnchor}
  aria-label={`${exercise.id} ${practice ? 'practice' : 'worked example'}`}
>
  <div class="exercise-head">
    <h3><span class="tag">{exercise.id}</span>{exercise.title}</h3>
    <span class="tag"
      >{practice ? `Practice · seed ${seed}` : 'Worked example'} · {exercise.minutes} min</span
    >
  </div>
  <div class="exercise-content">
    {#if storageWarning}<p class="small feedback" role="status">{storageWarning}</p>{/if}
    {#if storageWarning}<button class="button secondary" onclick={exportDraft}
        >Export this draft</button
      >{/if}
    <p class="small muted">
      {practice
        ? 'Use the new givens below with the same method.'
        : 'Follow the reasoning and substitutions below, then try the method yourself.'}
      {exercise.id === 'A07' && practice
        ? 'The graph stays fixed; change the selected account in the graph explorer for another path question.'
        : ''}
    </p>
    <div class="exercise-problem">
      <p>{learning.scenario}</p>
      <p>{learning.task}</p>
      {#if !practice && learning.workedDetails}
        <details>
          <summary>Example details</summary>
          {#each learning.workedDetails as paragraph}<p>{paragraph}</p>{/each}
        </details>
      {/if}
    </div>
    <div class="givens">
      {#each Object.entries(givens) as [key, value]}<div class="given">
          <b>{exercise.labels[key] ?? key}</b><span
            >{Array.isArray(value) ? value.join(', ') : value}</span
          >
        </div>{/each}
    </div>
    {#if visualLink}
      <a class="visual-concept-link" href={visualHref(visualLink.href)}>{visualLink.label} →</a>
      {#if !instructor || revealed}
        <details class="exercise-visual" bind:open={visualOpen} ontoggle={toggleVisual}>
          <summary>Illustrate these exact givens</summary>
          <p class="small muted">
            {practice
              ? 'This illustration includes calculated results. Opening it records help for this practice variant without completing any answer.'
              : 'The illustration below follows this exercise’s current givens. Select a calculation to focus on it.'}
          </p>
          {#if visualOpen}
            <label class="visual-step-select"
              >Calculation to inspect<select bind:value={visualStep}
                ><option value="">Current exercise step</option
                >{#each exercise.steps as step}<option value={step.id}>{step.title}</option
                  >{/each}</select
              ></label
            >
            <Illustration
              id={exercise.id}
              {givens}
              focusStep={visualStep || exercise.steps[Math.max(0, next)]?.id}
            />
          {/if}
        </details>
      {/if}
    {/if}
    <div class="button-row">
      {#if practice}<button class="button secondary" onclick={renew}>New numbers</button
        >{:else}<button
          class="button secondary"
          onclick={toggleWorked}
          disabled={instructor && !revealed}
          >{follow ? 'Try this example' : 'Show worked steps'}</button
        >{/if}<button class="button quiet" onclick={clear}>Start again</button
      >{#if instructor}<button class="button secondary" onclick={() => (revealed = !revealed)}
          >{revealed ? 'Hide solutions' : 'Reveal solutions'}</button
        >{/if}
    </div>
    {#if instructor}<Timer minutes={exercise.minutes} />{/if}
    {#if !follow}<div
        class="step-track"
        role="group"
        aria-label={`${Object.keys(completed).length} of ${exercise.steps.length} steps complete`}
      >
        {#each exercise.steps as step}<span class:done={completed[step.id]}></span>{/each}
      </div>{/if}
    {#each exercise.steps as step, index}
      {#if follow || index <= (next === -1 ? exercise.steps.length : next)}
        <div class="step-row">
          <div class="step-label">
            <span class="step-index">{completed[step.id] ? '✓' : index + 1}</span><label
              for={`${exercise.id}-${practice ? 'p' : 'w'}-${step.id}`}
              >{step.title}{step.unit ? ` (${step.unit})` : ''}</label
            >
          </div>
          {#if !follow && !completed[step.id]}
            <form
              class="step-inputs"
              onsubmit={(e) => {
                e.preventDefault();
                submit(step);
              }}
            >
              {#if Array.isArray(solution[step.id])}
                <div class="cell-table">
                  {#each solution[step.id] as number[] as _, i}<label
                      >{cellLabel(step.id, i)}<input
                        class="cell-input"
                        class:wrong={wrongCells[step.id]?.includes(i)}
                        aria-label={`${step.title}: ${cellLabel(step.id, i)}`}
                        id={i === 0
                          ? `${exercise.id}-${practice ? 'p' : 'w'}-${step.id}`
                          : undefined}
                        inputmode="decimal"
                        value={cellAnswers[step.id]?.[i] ?? ''}
                        oninput={(e) =>
                          cellChange(
                            step.id,
                            i,
                            e.currentTarget.value,
                            (solution[step.id] as number[]).length,
                          )}
                      /></label
                    >{/each}
                </div>
              {:else if typeof solution[step.id] === 'boolean'}<select
                  id={`${exercise.id}-${practice ? 'p' : 'w'}-${step.id}`}
                  value={answers[step.id] ?? ''}
                  onchange={(event) => answerChange(step.id, event.currentTarget.value)}
                  required
                  ><option value="">Choose an answer</option><option>Yes</option><option>No</option
                  ></select
                >
              {:else}<input
                  id={`${exercise.id}-${practice ? 'p' : 'w'}-${step.id}`}
                  inputmode="decimal"
                  placeholder={step.unit === 'proportion' ? '0.10 or 10%' : 'Your answer'}
                  value={answers[step.id] ?? ''}
                  oninput={(event) => answerChange(step.id, event.currentTarget.value)}
                  required
                />{/if}
              <button class="button" type="submit">Check answer</button>
            </form>
            <div class="button-row" style="margin-left:2rem">
              {#if step.hints.length}<button class="hint-button" onclick={() => requestHint(step)}
                  >Hint{hints[step.id] ? ` ${hints[step.id]}/${step.hints.length}` : ''}</button
                >{/if}{#if !instructor || revealed}<button
                  class="hint-button"
                  onclick={() => show(step)}>Show solution</button
                >{/if}
            </div>
            {#if hints[step.id]}<p class="hint">{step.hints[hints[step.id] - 1]}</p>{/if}
          {/if}
          {#if messages[step.id]}<p
              role="status"
              class="feedback"
              class:correct={messages[step.id].correct}
            >
              {messages[step.id].message}{wrongCells[step.id]?.length
                ? ` Check cells ${wrongCells[step.id].map((i) => i + 1).join(', ')}.`
                : ''}
            </p>{/if}
          {#if (completed[step.id] || follow) && (!instructor || revealed)}<div
              class="revealed student-solution"
              class:instructor-revealed={revealed}
            >
              {step.title}: {format(solution[step.id], step.unit)}
              {#if shown[step.id]}<span class="tag">With help</span
                >{:else if completed[step.id]}<span class="tag">Independent</span>{/if}
              {#if follow}
                {#if step.explanation}<p class="step-reason">
                    <b>Why this step matters:</b>
                    {stepReason(step)}
                  </p>
                {:else}<p class="step-reason">
                    <b>Calculation hint:</b>
                    {step.hints[0]}
                  </p>{/if}
              {/if}
            </div>{/if}
        </div>
      {/if}
    {/each}
    {#if (finished || follow) && (!instructor || revealed)}<div
        class="exercise-complete student-solution"
        class:instructor-revealed={revealed}
      >
        <b>{follow ? 'What the results mean' : 'Calculation complete'}</b>
        <p>{exerciseSummary(exercise, solution)}</p>
        <p>{learning.interpretation}</p>
        {#if !practice}
          <div class="worked-reasoning">
            <h4>Why these steps matter</h4>
            {#each learning.workedExplanation as paragraph}<p class="small">{paragraph}</p>{/each}
          </div>
        {/if}
        {#if !practice}<div class="worked-arithmetic">
            <h4>Worked arithmetic</h4>
            <ol>
              {#each learning.workedArithmetic as calculation}<li>{calculation}</li>{/each}
            </ol>
          </div>{:else}<details>
            <summary>Review the method</summary>
            <ol>
              {#each exercise.steps as step}
                <li>
                  <b>{step.title}: {format(solution[step.id], step.unit)}</b>
                  {#if step.explanation}<p class="small">
                      <b>Why this step matters:</b>
                      {stepReason(step)}
                    </p>
                  {:else}<p class="small">
                      <b>Calculation hint:</b>
                      {step.hints[0]}
                    </p>{/if}
                  {#each step.hints as hint}<p class="small">{hint}</p>{/each}
                </li>
              {/each}
            </ol>
          </details>{/if}
      </div>{/if}
  </div>
</section>
