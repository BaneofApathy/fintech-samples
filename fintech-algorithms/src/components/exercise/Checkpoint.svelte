<script lang="ts">
  import type { PracticeQuestion } from '../../data/teaching-types';
  import type { PracticeTopic } from '../../engine/assessment';
  import ConceptPractice from './ConceptPractice.svelte';
  let {
    topic,
    questions,
    base = '/',
    lessonHref,
  }: {
    topic: PracticeTopic;
    questions: PracticeQuestion[];
    base?: string;
    lessonHref?: string;
  } = $props();
</script>

<p class="small muted">
  A balanced checkpoint covers definitions, how the method works, calculations, and financial
  applications. The first checked answer to each question sets the score; hints and retries are
  shown separately.
</p>
<ConceptPractice
  {topic}
  {questions}
  {base}
  {lessonHref}
  sessionId={`${topic.id}:checkpoint`}
  checkpoint
  title="Unit checkpoint"
/>
