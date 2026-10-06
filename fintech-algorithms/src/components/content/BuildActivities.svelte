<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { Algorithm, Exercise } from '../../data';
  import type { LabDefinition } from '../python/lab-presentation';
  import PythonRunner from '../python/PythonRunner.svelte';
  import Checkpoint from '../exercise/Checkpoint.svelte';
  import Defense from '../exercise/Defense.svelte';
  import type { PracticeTopic } from '../../engine/assessment';
  import type { PracticeQuestion } from '../../data/teaching-types';
  import { recordActivity } from '../../engine/progress';
  const href = (path: string) =>
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  let {
    algorithm,
    sources,
    lab,
    teaching,
    questions,
  }: { algorithm: Algorithm; sources: Exercise[]; lab: LabDefinition; teaching: PracticeTopic; questions: PracticeQuestion[] } = $props();
  const activities = [
    { id: 'run', label: 'Run & compare' },
    { id: 'checkpoint', label: 'Check understanding' },
    { id: 'defense', label: 'Defend your decision' },
  ] as const;
  type Activity = (typeof activities)[number]['id'];
  let active = $state<Activity>('run');
  function fromHash(): Activity {
    const hash = window.location.hash.slice(1);
    if (hash === 'checkpoint' || hash === 'unit-checkpoint' || hash.startsWith('checkpoint-'))
      return 'checkpoint';
    if (hash === 'defense' || hash === 'defend' || hash.startsWith('defense-')) return 'defense';
    return 'run';
  }
  onMount(() => {
    const sync = async () => {
      active = fromHash();
      await tick();
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  });
  function select(id: Activity) {
    active = id;
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${id}`,
    );
    recordActivity({
      id: `algorithm:${algorithm.slug}:activity:${id}`,
      href: `${window.location.pathname}${window.location.search}#${id}`,
      title: `${algorithm.title} · ${activities.find((activity) => activity.id === id)!.label}`,
    });
  }
  function move(event: KeyboardEvent, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % activities.length;
    else if (event.key === 'ArrowLeft') next = (index + activities.length - 1) % activities.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = activities.length - 1;
    else return;
    event.preventDefault();
    select(activities[next].id);
    document.getElementById(`activity-tab-${activities[next].id}`)?.focus();
  }
</script>

<div class="build-activities">
  <h2>Build confidence in your decision</h2>
  <p class="activity-intro">
    Run an experiment, check your understanding, or explain your recommendation. You can move
    between activities at any time.
  </p>
  <div class="activity-tabs" role="tablist" aria-label="Build and defend activities">
    {#each activities as activity, i}<button
        type="button"
        id={`activity-tab-${activity.id}`}
        role="tab"
        aria-selected={active === activity.id}
        aria-controls={activity.id}
        tabindex={active === activity.id ? 0 : -1}
        onclick={() => select(activity.id)}
        onkeydown={(event) => move(event, i)}
        ><span class="activity-number">{i + 1}</span>{activity.label}</button
      >{/each}
  </div>
  <div
    id="run"
    class="activity-panel"
    role="tabpanel"
    aria-labelledby="activity-tab-run"
    tabindex="0"
    hidden={active !== 'run'}
  >
    <PythonRunner code={lab.code} edits={lab.edits} slug={algorithm.slug} metric={lab.metric} />
    <details class="lab-context">
      <summary>Dataset, comparison and notebook</summary>
      <h3>Prepared lab</h3>
      <p>{lab.dataset}</p>
      <p>{lab.task}</p>
      <h3>Keep the comparison fair</h3>
      <p>{lab.comparison}</p>
      <h3>Optional extension</h3>
      <p>{lab.extension}</p>
      <div class="button-row">
        <a class="button secondary" href={href(`/labs/lab/index.html?path=${algorithm.slug}.ipynb`)}
          >Open notebook</a
        ><a class="button quiet" href={href(`/notebooks/${algorithm.slug}.ipynb`)} download
          >Download .ipynb</a
        >
      </div>
    </details>
  </div>
  <div
    id="checkpoint"
    class="activity-panel"
    role="tabpanel"
    aria-labelledby="activity-tab-checkpoint"
    tabindex="0"
    hidden={active !== 'checkpoint'}
  >
    <Checkpoint topic={teaching} {questions} base={import.meta.env.BASE_URL} />
  </div>
  <div
    id="defense"
    class="activity-panel"
    role="tabpanel"
    aria-labelledby="activity-tab-defense"
    tabindex="0"
    hidden={active !== 'defense'}
  >
    <details class="method-guidance">
      <summary>When is this method appropriate?</summary>
      <h3>Use it when</h3>
      <ul>
        {#each algorithm.useWhen as item}<li>{item}</li>{/each}
      </ul>
      <h3>Choose another approach when</h3>
      <ul>
        {#each algorithm.avoidWhen as item}<li>{item}</li>{/each}
      </ul>
    </details>
    <Defense unit={algorithm.slug} questions={algorithm.defenseQuestions} />
  </div>
</div>

<style>
  .build-activities {
    min-width: 0;
  }
  h2 {
    margin-bottom: 0.5rem;
  }
  .activity-intro {
    max-width: 68ch;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .activity-tabs {
    display: flex;
    gap: 0.4rem;
    border-bottom: 1px solid var(--line);
    margin: 1.5rem 0 2rem;
    padding-bottom: 0.5rem;
  }
  .activity-tabs button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    min-height: 48px;
    padding: 0.75rem 0.6rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--muted);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .activity-tabs button[aria-selected='true'] {
    color: var(--green);
    border-color: var(--line);
    background: var(--paper);
    font-weight: 650;
  }
  .activity-number {
    font-size: 0.75rem;
  }
  .activity-panel {
    min-width: 0;
    scroll-margin-top: 7rem;
  }
  .activity-panel[hidden] {
    display: none !important;
  }
  .lab-context,
  .method-guidance {
    border-top: 1px solid var(--line);
    margin: 1.75rem 0;
  }
  summary {
    padding: 1rem 0;
    min-height: 44px;
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: 600;
  }
  .lab-context h3,
  .method-guidance h3 {
    font-size: 1rem;
    margin: 1rem 0 0.4rem;
  }
  .lab-context p,
  .method-guidance li {
    font-size: 0.9rem;
    line-height: 1.7;
  }
  @media (max-width: 600px) {
    .activity-tabs {
      flex-direction: column;
      gap: 0.15rem;
      margin-bottom: 1.5rem;
    }
    .activity-tabs button {
      justify-content: flex-start;
    }
  }
</style>
