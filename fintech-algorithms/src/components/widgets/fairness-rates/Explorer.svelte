<script lang="ts">
  import Widget from '../Widget.svelte';
  import type { Exercise } from '../../../engine/types';
  let { exercise }: { exercise: Exercise } = $props();
</script>

<Widget id="fairness-rates" {exercise} />
