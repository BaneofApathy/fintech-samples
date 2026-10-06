<script lang="ts">
  import { onMount } from 'svelte';
  import { read, response, download } from '../../engine/progress';
  let text = $state('');
  let saveStatus = $state('');
  onMount(() => {
    text = read().answers['capstone:recommendation'] || '';
    const storageFailed = () =>
      (saveStatus = 'This browser could not save the recommendation. Export it before leaving.');
    window.addEventListener('course-storage-error', storageFailed);
    return () => window.removeEventListener('course-storage-error', storageFailed);
  });
  function saveText(value: string) {
    saveStatus = 'Saved.';
    response('capstone:recommendation', value);
  }
</script>

<section>
  <h2>Deployment recommendation</h2>
  <p class="muted small">Write a short recommendation that includes:</p>
  <ul class="small">
    <li>Your decision: deploy, pilot, revise or reject, and for which use.</li>
    <li>Results against the baseline on held-out data, including the financial consequence.</li>
    <li>A known failure and the review, constraint or fallback that addresses it.</li>
    <li>What to monitor, how often, and when to pause or replace the system.</li>
  </ul>
  <div class="defense-response">
    <label for="recommendation">One paragraph the decision owner can act on</label><textarea
      id="recommendation"
      bind:value={text}
      oninput={(e) => saveText(e.currentTarget.value)}></textarea>
  </div>
  {#if saveStatus}<p class="saved-note" role="status">{saveStatus}</p>{/if}
  <button
    class="button secondary"
    onclick={() => download('deployment-recommendation.txt', text, 'text/plain')}
    >Export recommendation</button
  >
</section>
