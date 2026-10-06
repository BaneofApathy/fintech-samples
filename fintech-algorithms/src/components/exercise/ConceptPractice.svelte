<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PracticeQuestion } from '../../data/teaching-types';
  import { dimensions } from '../../data/teaching-types';
  import {
    checkQuestion,
    compatibleSession,
    createSession,
    finishSession,
    helpQuestion,
    questionLessonHref,
    retryQuestion,
    sessionResult,
    type AssessmentSession,
    type PracticeTopic,
  } from '../../engine/assessment';
  import { read, save, recordActivity, download, type Progress } from '../../engine/progress';
  let {
    topic,
    questions,
    sessionId,
    base = '/',
    checkpoint = false,
    title = 'Practice your understanding',
    lessonHref,
    activityHref,
  }: {
    topic: PracticeTopic;
    questions: PracticeQuestion[];
    sessionId: string;
    base?: string;
    checkpoint?: boolean;
    title?: string;
    lessonHref?: string;
    activityHref?: string;
  } = $props();
  let session = $state<AssessmentSession>();
  let history = $state<NonNullable<Progress['conceptAttempts']>>([]);
  let saveStatus = $state('');
  let storageFailed = $state(false);
  const active = $derived(questions.find((q) => q.id === session?.questionIds[session.index]));
  const item = $derived(active && session ? session.items[active.id] : undefined);
  const choices = $derived(
    active && session
      ? session.choiceOrders[active.id]
          .map((id) => active.choices.find((choice) => choice.id === id)!)
          .filter(Boolean)
      : [],
  );
  const selected = $derived(active?.choices.find((choice) => choice.id === item?.selected));
  const correct = $derived(!!active && item?.selected === active.correctChoiceId);
  const finished = $derived(!!session && session.index >= session.questionIds.length);
  const result = $derived(session ? sessionResult(session, history, sessionId) : undefined);
  const reviewHref = $derived(
    active
      ? lessonHref
        ? `${lessonHref.split('#')[0]}#${encodeURIComponent(active.lessonId)}`
        : questionLessonHref(topic, active, base)
      : '',
  );
  const dimensionLabels = {
    definition: 'Definitions & terminology',
    mechanism: 'How it works',
    calculation: 'Calculate & trace',
    application: 'Apply it in finance',
  };
  function currentProgress() {
    const p = read();
    p.conceptAttempts = [
      ...new Map([...(p.conceptAttempts ?? []), ...history].map((a) => [a.eventId, a])).values(),
    ];
    return p;
  }
  function persist(progress = currentProgress(), userAction = true) {
    if (!session) return;
    progress.assessmentSessions ??= {};
    progress.assessmentSessions[sessionId] = $state.snapshot(session);
    history = progress.conceptAttempts ?? [];
    const stored = save(progress);
    storageFailed = !stored;
    saveStatus = stored
      ? userAction
        ? 'Saved.'
        : ''
      : 'This browser could not save practice. Keep this page open and export your work before leaving.';
    if (userAction) {
      const anchor = checkpoint
        ? 'checkpoint'
        : window.location.pathname.includes('/measures/')
          ? 'practice'
          : 'concept-practice';
      recordActivity({
        id: sessionId,
        href:
          activityHref ??
          lessonHref ??
          `${window.location.pathname}${window.location.search}#${anchor}`,
        title: `${topic.title} · ${title} · ${session.index >= session.questionIds.length ? 'Results' : `Question ${session.index + 1}`}`,
      });
    }
  }
  onMount(() => {
    const p = read(),
      existing = p.assessmentSessions?.[sessionId];
    const freshSeed = (existing?.seed ?? 0) + 1;
    session = compatibleSession(existing, topic.id, questions, checkpoint)
      ? existing
      : createSession(topic.id, questions, freshSeed, checkpoint);
    history = p.conceptAttempts ?? [];
    if (questions.length) persist(p, false);
  });
  function choose(choiceId: string) {
    if (!item || item.checked) return;
    item.selected = choiceId;
    persist();
  }
  async function focusActivity(suffix: 'question' | 'feedback' | 'hint' | 'result') {
    await tick();
    const target = document.getElementById(`${sessionId}-${suffix}`);
    target?.focus();
    target?.scrollIntoView({ block: 'nearest' });
  }
  async function submit() {
    if (!active || !session) return;
    const p = currentProgress();
    if (!checkQuestion(p, sessionId, session, active)) return;
    persist(p);
    await focusActivity('feedback');
  }
  async function help(kind: 'hint' | 'revealed') {
    if (!active || !session) return;
    const p = currentProgress();
    helpQuestion(p, sessionId, session, active, kind);
    persist(p);
    await focusActivity(kind === 'hint' ? 'hint' : 'feedback');
  }
  async function retry() {
    if (!active || !session) return;
    retryQuestion(session, active.id);
    persist();
    await focusActivity('question');
  }
  async function next() {
    if (!session || !item?.checked) return;
    session.index++;
    const p = currentProgress();
    if (session.index === session.questionIds.length) {
      finishSession(p, sessionId, session);
    }
    persist(p);
    await focusActivity(finished ? 'result' : 'question');
  }
  async function restart() {
    session = createSession(topic.id, questions, (session?.seed ?? 0) + 1, checkpoint);
    persist();
    await focusActivity('question');
  }
  function exportPractice() {
    const p = currentProgress();
    if (session) {
      p.assessmentSessions ??= {};
      p.assessmentSessions[sessionId] = $state.snapshot(session);
    }
    download('fintech-practice-backup.json', JSON.stringify(p, null, 2));
  }
  function dimensionResult(dimension: (typeof dimensions)[number]) {
    const ids =
      session?.questionIds.filter(
        (id) => questions.find((q) => q.id === id)?.dimension === dimension,
      ) ?? [];
    const right = ids.filter((id) => session?.items[id]?.firstCorrect).length;
    return { total: ids.length, correct: right };
  }
</script>

<section
  class="concept-practice exercise-card"
  data-concept-practice={sessionId}
  aria-label={title}
>
  <div class="exercise-head">
    <h3>{title}</h3>
    {#if checkpoint}<span class="tag">80% to pass</span>{/if}
  </div>
  <div class="exercise-content">
    {#if !questions.length}
      <p>
        This topic has no questions in this activity yet. Review its lesson and try the numerical
        examples.
      </p>
    {:else if !session}
      <p>Loading practice…</p>
    {:else if finished && result}
      <div
        class="practice-result"
        id={`${sessionId}-result`}
        tabindex="-1"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby={`${sessionId}-result-heading`}
      >
        <h4 id={`${sessionId}-result-heading`}>
          {checkpoint
            ? result.score >= 0.8
              ? 'Checkpoint passed'
              : 'Review the missed questions and try again'
            : 'Practice complete'}
        </h4>
        <p>
          <strong
            >{result.correct} of {result.total} first answers correct · {Math.round(
              result.score * 100,
            )}%</strong
          >
        </p>
        <p>
          {result.independent} independent · {result.assisted} correct with help or prior practice
        </p>
        <p class="small muted">
          The score uses your first checked answer to each question in this session. Answers given
          after a hint, explanation, or prior practice count as assisted.
        </p>
      </div>
      <ul class="dimension-results" aria-label="Results by learning objective">
        {#each dimensions as dimension}
          {@const summary = dimensionResult(dimension)}
          {#if summary.total}<li>
              <span>{dimensionLabels[dimension]}</span><strong
                >{summary.correct} / {summary.total}</strong
              >
            </li>{/if}
        {/each}
      </ul>
      {#if session.questionIds.some((id) => session?.items[id]?.firstCorrect === false)}
        <div class="practice-review">
          <h4>Review the ideas you missed</h4>
          <ul>
            {#each session.questionIds.filter((id) => session?.items[id]?.firstCorrect === false) as id}
              {@const question = questions.find((q) => q.id === id)!}
              <li>
                <a
                  href={lessonHref
                    ? `${lessonHref.split('#')[0]}#${encodeURIComponent(question.lessonId)}`
                    : questionLessonHref(topic, question, base)}
                  >{topic.objectives.find((o) => o.id === question.objectiveId)?.title ??
                    dimensionLabels[question.dimension]}</a
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      <button class="button" onclick={restart}
        >{checkpoint ? 'Try checkpoint again' : 'Start another practice session'}</button
      >
    {:else if active && item}
      <div class="practice-position">
        <span>Question {session.index + 1} of {session.questionIds.length}</span><span
          >{dimensionLabels[active.dimension]}</span
        >
      </div>
      <progress
        value={session.index}
        max={session.questionIds.length}
        aria-label={`${session.index} of ${session.questionIds.length} questions completed`}
      ></progress>
      <form
        onsubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset class="practice-question" disabled={item.checked}>
          <legend id={`${sessionId}-question`} tabindex="-1">{active.prompt}</legend>
          {#each choices as choice}
            <label
              class="practice-choice"
              class:selected={item.selected === choice.id}
              class:correct-choice={item.checked && choice.id === active.correctChoiceId}
            >
              <input
                type="radio"
                name={`${sessionId}-${active.id}`}
                value={choice.id}
                checked={item.selected === choice.id}
                onchange={() => choose(choice.id)}
              />
              <span>{choice.text}</span>
            </label>
          {/each}
        </fieldset>
        {#if !item.checked}<div class="button-row">
            <button class="button" type="submit" disabled={!item.selected}>Check answer</button>
            <button
              class="button quiet"
              type="button"
              onclick={() => help('hint')}
              disabled={item.hintUsed}>Get a hint</button
            >
            <button
              class="button quiet"
              type="button"
              onclick={() => help('revealed')}
              disabled={item.revealed}>Show explanation</button
            >
          </div>{/if}
      </form>
      {#if item.hintUsed && !item.checked}<p
          class="hint"
          id={`${sessionId}-hint`}
          tabindex="-1"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong>Hint:</strong>
          {active.hint}
        </p>{/if}
      {#if item.checked || item.revealed}
        <div
          class="practice-feedback"
          class:correct={item.checked && correct}
          id={`${sessionId}-feedback`}
          tabindex="-1"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-labelledby={`${sessionId}-feedback-heading`}
        >
          <h4 id={`${sessionId}-feedback-heading`}>
            {item.checked
              ? correct
                ? 'Correct'
                : 'Incorrect'
              : 'Worked explanation'}
          </h4>
          {#if item.checked && selected && selected.explanation !== active.explanation}<p>
              {selected.explanation}
            </p>{/if}
          <p>
            <strong>Answer:</strong>
            {active.choices.find((c) => c.id === active.correctChoiceId)?.text}
          </p>
          <p>{active.explanation}</p>
          {#if item.checked && correct}<p class="small">
              <strong
                >{history.some(
                  (a) =>
                    a.sessionId === sessionId &&
                    a.run === session?.run &&
                    a.questionId === active?.id &&
                    a.independent,
                )
                  ? 'Independent answer'
                  : 'Correct with help or prior practice'}</strong
              >
            </p>{/if}
          <a href={reviewHref}>Review this lesson →</a>
          <details>
            <summary>Understand the other choices</summary>
            <ul>
              {#each active.choices as choice}<li>
                  <strong>{choice.text}</strong>
                  <p>{choice.explanation}</p>
                </li>{/each}
            </ul>
          </details>
        </div>
      {/if}
      {#if item.checked}<div class="button-row">
          {#if !correct}<button class="button secondary" onclick={retry}
              >Try this question again</button
            >{/if}
          <button class="button" onclick={next}
            >{session.index === session.questionIds.length - 1
              ? 'See my results'
              : 'Next question →'}</button
          >
        </div>{/if}
    {/if}
    {#if saveStatus}<p class="practice-saved small muted" role="status">{saveStatus}</p>{/if}
    {#if storageFailed}<button class="button secondary" onclick={exportPractice}
        >Export this practice</button
      >{/if}
  </div>
</section>

<style>
  .concept-practice {
    scroll-margin-top: 6rem;
    overflow-wrap: anywhere;
  }
  .practice-feedback,
  .practice-result,
  .hint,
  legend {
    scroll-margin-top: 6rem;
  }
  .practice-position {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--muted);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
  progress {
    width: 100%;
    height: 0.4rem;
    accent-color: var(--green);
    margin-bottom: 1.4rem;
  }
  .practice-question {
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
  }
  legend {
    font-weight: 650;
    font-size: 1.05rem;
    line-height: 1.7;
    width: 100%;
    margin-bottom: 0.9rem;
  }
  .practice-choice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0.9rem;
    margin: 0.6rem 0;
    cursor: pointer;
    line-height: 1.6;
    min-height: 48px;
    background: var(--paper);
  }
  .practice-choice input {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 0.25rem;
    accent-color: var(--green);
  }
  .practice-choice.selected {
    border-color: var(--green);
    outline: 1px solid var(--green);
  }
  .practice-choice.correct-choice {
    border-color: var(--green);
  }
  fieldset:disabled .practice-choice {
    cursor: default;
  }
  .practice-choice:focus-within {
    outline: 2px solid var(--blue);
    outline-offset: 2px;
  }
  .practice-feedback {
    border-left: 4px solid var(--gold);
    background: var(--paper);
    padding: 1rem 1.2rem;
    margin: 1rem 0;
    line-height: 1.7;
  }
  .practice-feedback.correct {
    border-left-color: var(--green);
  }
  h4 {
    font-size: 1rem;
    margin: 0.2rem 0 0.6rem;
  }
  .practice-feedback details {
    margin-top: 0.8rem;
  }
  .practice-feedback summary {
    cursor: pointer;
    min-height: 44px;
    padding: 0.5rem 0;
  }
  .practice-feedback li p {
    margin: 0.2rem 0 0.7rem;
  }
  .dimension-results {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }
  .dimension-results li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid var(--line);
  }
  .practice-review {
    margin: 1.5rem 0;
  }
  .practice-saved {
    margin-top: 1rem;
  }
  @media (max-width: 600px) {
    .practice-choice {
      padding: 0.75rem;
    }
    .practice-feedback {
      padding: 0.8rem;
    }
  }
</style>
