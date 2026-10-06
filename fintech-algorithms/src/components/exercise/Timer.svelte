<script lang="ts">
  import { onMount, untrack } from 'svelte';
  let { minutes = 7 }: { minutes?: number } = $props();
  let remaining = $state(untrack(() => minutes * 60)),
    running = $state(false);
  const display = $derived(
    `${Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`,
  );
  onMount(() => {
    const id = setInterval(() => {
      if (running && remaining > 0) remaining--;
      if (remaining === 0) running = false;
    }, 1000);
    return () => clearInterval(id);
  });
</script>

<div class:pencils-down={remaining === 0} class="timer">
  <span aria-live={remaining === 0 ? 'polite' : 'off'}
    >{remaining === 0 ? 'Pencils down' : display}</span
  ><button class="hint-button" onclick={() => (running = !running)}
    >{running ? 'Pause' : 'Start timer'}</button
  ><button
    class="hint-button"
    aria-label="Reset timer"
    onclick={() => {
      remaining = minutes * 60;
      running = false;
    }}>Reset</button
  >
</div>
