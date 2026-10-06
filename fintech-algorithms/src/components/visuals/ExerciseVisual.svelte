<script lang="ts">
  import type { Givens } from '../../engine/types';
  import { exerciseVisualLinks } from '../../data/visual-links';
  import AlgorithmVisual from './algorithms/AlgorithmVisual.svelte';
  import MeasureVisual from './measures/MeasureVisual.svelte';
  import SupplementVisual from './SupplementVisual.svelte';
  let { id, givens, focusStep }: { id: string; givens: Givens; focusStep?: string } = $props();
  const link = $derived(exerciseVisualLinks[id]);
</script>

{#if link?.kind === 'algorithm'}
  <AlgorithmVisual slug={link.visualId} mode="worked" {givens} exerciseId={id} {focusStep} />
{:else if link?.kind === 'measure'}
  <MeasureVisual number={Number(link.visualId)} {givens} exerciseId={id} {focusStep} />
{:else if link?.kind === 'supplement'}
  <SupplementVisual id={link.visualId} {givens} {focusStep} />
{/if}
