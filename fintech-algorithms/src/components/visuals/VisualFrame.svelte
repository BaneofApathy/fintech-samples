<script lang="ts">
  import type { Snippet } from 'svelte';
  let {
    title,
    question,
    takeaway,
    source,
    children,
  }: {
    title: string;
    question: string;
    takeaway: string;
    source?: string;
    children: Snippet;
  } = $props();
</script>

<section class="visual-frame" aria-label={title}>
  <header class="visual-heading">
    <h3>{title}</h3>
    <p class="visual-question">{question}</p>
    {#if source}<p class="visual-source">{source}</p>{/if}
  </header>
  <div class="visual-content">{@render children()}</div>
  <p class="visual-takeaway"><strong>Takeaway</strong> {takeaway}</p>
</section>
