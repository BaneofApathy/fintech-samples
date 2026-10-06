<script lang="ts">
  import { onMount } from 'svelte';
  import { read, mark } from '../../engine/progress';
  let {
    section,
    nextUrl,
    nextLabel = 'Next section',
    previousUrl,
    previousLabel: customPreviousLabel,
  }: { section: string; nextUrl?: string; nextLabel?: string; previousUrl?: string; previousLabel?: string } = $props();
  const sectionKeys = [
    'problem',
    'intuition',
    'formula',
    'worked',
    'practice',
    'measures',
    'defend',
  ];
  const sectionLabels = [
    'Problem',
    'Intuition',
    'Formula',
    'Worked example',
    'Practice',
    'Measures',
    'Build & defend',
  ];
  let previousLabel = $derived(
    customPreviousLabel ?? sectionLabels[sectionKeys.indexOf(section.split(':')[1]) - 1] ?? 'All units',
  );
  let previous = $derived.by(() => {
    if (previousUrl) return previousUrl;
    const [slug, key] = section.split(':');
    const index = sectionKeys.indexOf(key);
    const base = import.meta.env.BASE_URL;
    if (index <= 0) return base;
    return `${base}algorithms/${slug}/${index === 1 ? '' : sectionKeys[index - 1] + '/'}`;
  });
  let done = $state(false);
  onMount(() => {
    done = !!read().sections[section];
  });
</script>

<div class="completion-row" data-section={section}>
  <a class="completion-previous" href={previous}>← {previousLabel}</a>
  <div class="completion-actions">
    <button
      class="button quiet"
      aria-pressed={done}
      onclick={() => {
        done = !done;
        mark(section, done);
      }}>{done ? '✓ Read' : 'Mark as read'}</button
    >{#if nextUrl}<a class="button" href={nextUrl}>Continue to {nextLabel} →</a>{/if}
  </div>
</div>
