import type { PracticeTopic } from './assessment';

/** Review starts at the explanation for the missed objective. */
export function reviewLessonHref(topic: PracticeTopic, objectiveId: string, base = '/') {
  const root = base.replace(/\/$/, '');
  const lesson = topic.lessons?.find((item) => item.objectiveId === objectiveId);
  const route =
    topic.kind === 'algorithm'
      ? `/algorithms/${topic.slug}/${lesson?.section ?? 'practice'}/`
      : topic.kind === 'measure'
        ? `/measures/${topic.slug}/`
        : `/foundations/${topic.slug}/`;
  return root + route + (lesson ? '#' + encodeURIComponent(lesson.id) : '');
}
