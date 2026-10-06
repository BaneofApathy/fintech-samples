import { algorithmTopics } from './algorithm-course';
import { measureTopics } from './measure-course';
import { foundationTopics } from './foundation-course';
import type { TeachingTopic, TeachingStage } from './teaching-types';

export const teachingTopics: TeachingTopic[] = [
  ...algorithmTopics,
  ...measureTopics,
  ...foundationTopics,
];
export const teachingTopic = (id: string) => {
  const topic = teachingTopics.find((t) => t.id === id);
  if (!topic) throw new Error(`Missing teaching topic: ${id}`);
  return topic;
};
export const localHref = (path: string) =>
  `${(import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export function topicHref(
  topic: Pick<TeachingTopic, 'kind' | 'slug'>,
  stage?: TeachingStage,
  anchor?: string,
) {
  const path =
    topic.kind === 'algorithm'
      ? `/algorithms/${topic.slug}/${stage && stage !== 'problem' ? stage + '/' : ''}`
      : topic.kind === 'measure'
        ? `/measures/${topic.slug}/`
        : `/foundations/${topic.slug}/`;
  return localHref(path) + (anchor ? `#${anchor}` : '');
}
export const prerequisiteTitle = (slug: string) =>
  foundationTopics.find((t) => t.slug === slug)?.title ?? slug;
export const prerequisiteHref = (slug: string) => localHref(`/foundations/${slug}/`);
export const learningManifest = teachingTopics.map((t) => ({
  id: t.id,
  kind: t.kind,
  slug: t.slug,
  title: t.title,
  href: topicHref(t),
  prerequisites: t.prerequisites.map((slug) => ({
    id: 'foundation:' + slug,
    title: prerequisiteTitle(slug),
    href: prerequisiteHref(slug),
  })),
  objectives: t.objectives,
  lessons: t.lessons.map((l, i) => ({
    id: l.id,
    title: l.title,
    order: i + 1,
    objectiveId: l.objectiveId,
    section: l.section,
    href: topicHref(t, l.section, l.id),
  })),
  questions: t.questions.map((q) => ({
    id: q.id,
    objectiveId: q.objectiveId,
    dimension: q.dimension,
    role: q.role,
    lessonId: q.lessonId,
  })),
}));

export const conceptualGlossary = teachingTopics
  .flatMap((topic) =>
    topic.terms.map((term) => ({
      ...term,
      topicId: topic.id,
      topicTitle: topic.title,
      href: topicHref(topic, topic.lessons[0].section, topic.lessons[0].id),
    })),
  )
  .sort((a, b) => a.term.localeCompare(b.term) || a.topicTitle.localeCompare(b.topicTitle));
