<script lang="ts">
  import { onMount } from 'svelte';
  import { reviewLessonHref } from '../../engine/learning-navigation';
  import { empty, read, type Progress } from '../../engine/progress';
  import { reviewTopics, type PracticeTopic } from '../../engine/assessment';
  type Unit = { slug: string; title: string; description: string };
  let {
    units,
    base,
    topics = [],
  }: { units: Unit[]; base: string; topics?: PracticeTopic[] } = $props();
  let p = $state<Progress>(empty());
  const sections = ['problem', 'intuition', 'formula', 'worked', 'practice', 'measures', 'defend'];
  const labels = [
    'Problem',
    'Intuition',
    'Formula',
    'Worked example',
    'Practice',
    'Measures',
    'Build & defend',
  ];
  let resumed = $derived.by(() => {
    if (p.resume && units.some((u) => u.slug === p.resume?.slug)) return p.resume;
    const started = units.find((u) => sections.some((s) => p.sections[u.slug + ':' + s]));
    return started
      ? {
          slug: started.slug,
          section: sections.find((s) => !p.sections[started.slug + ':' + s]) ?? 'defend',
        }
      : undefined;
  });
  let unit = $derived(units.find((u) => u.slug === resumed?.slug) ?? units[0]);
  let section = $derived(resumed?.section ?? 'problem');
  let url = $derived(
    p.learningActivity?.href ??
      `${base}algorithms/${unit.slug}/${section === 'problem' ? '' : section + '/'}`,
  );
  let hasResume = $derived(!!p.learningActivity || !!resumed);
  let reviews = $derived(reviewTopics(p, topics).slice(0, 3));
  onMount(() => {
    const update = () => (p = read());
    update();
    window.addEventListener('course-progress', update);
    return () => window.removeEventListener('course-progress', update);
  });
</script>

<section class="continue-learning" aria-label="Your next activity">
  <div>
    <p class="eyebrow">
      {hasResume ? 'Pick up where you left off' : 'Your first financial decision'}
    </p>
    <h2>
      {p.learningActivity?.title ?? (resumed ? unit.title : 'When should a loan go to review?')}
    </h2>
    <p>
      {p.learningActivity
        ? 'Continue the lesson or question you last opened.'
        : unit.description}
    </p>
    {#if resumed && !p.learningActivity}<p class="resume-section">
        {unit.title} · {labels[sections.indexOf(section)]}
      </p>{/if}
    <a class="button" href={url}>{hasResume ? 'Continue learning' : 'Start learning'} →</a>
  </div>
  <div class="next-activity-note">
    <span class="activity-number"
      >{String(units.findIndex((u) => u.slug === unit.slug) + 1).padStart(2, '0')}</span
    >
    <span>{unit.title}</span>
    <small>Definitions → examples → practice → financial application.</small>
  </div>
</section>
{#if reviews.length}<aside class="next-reviews">
    <h3>Ideas to revisit</h3>
    <ul>
      {#each reviews as review}<li>
          <a
            href={reviewLessonHref(
              review.topic,
              review.summary.objectives.find((o) => o.needsReview)!.id,
              base,
            )}
            >{review.topic.title} · {review.summary.objectives.find((o) => o.needsReview)?.title}</a
          >
        </li>{/each}
    </ul>
  </aside>{/if}
