import type {
  PracticeQuestion,
  TeachingLesson,
  TeachingTopic,
  QuestionDimension,
} from '../data/teaching-types';
import { dimensions } from '../data/teaching-types';
import { random } from './variants';
import type { Progress } from './progress';

export type PracticeTopic = Pick<TeachingTopic, 'id' | 'kind' | 'slug' | 'title' | 'objectives'> & {
  lessons?: (Pick<TeachingLesson, 'id' | 'section'> & { objectiveId?: string })[];
};
export function toPracticeTopic(topic: TeachingTopic): PracticeTopic {
  return {
    id: topic.id,
    kind: topic.kind,
    slug: topic.slug,
    title: topic.title,
    objectives: topic.objectives,
    lessons: topic.lessons.map(({ id, section, objectiveId }) => ({ id, section, objectiveId })),
  };
}
export interface ConceptAttempt {
  eventId: string;
  sessionId: string;
  run: number;
  topicId: string;
  objectiveId: string;
  questionId: string;
  dimension: QuestionDimension;
  role: PracticeQuestion['role'];
  status: 'correct' | 'incorrect' | 'hint' | 'revealed';
  selectedChoiceId?: string;
  firstSubmission: boolean;
  independent: boolean;
  /** Successful retrieval may be unassisted even when the exact item was seen before. */
  unassisted?: boolean;
  time: string;
}
export interface QuestionState {
  selected?: string;
  checked: boolean;
  submissions: number;
  hintUsed: boolean;
  revealed: boolean;
  firstCorrect?: boolean;
}
export interface AssessmentSession {
  topicId: string;
  seed: number;
  run: number;
  checkpoint: boolean;
  questionIds: string[];
  choiceOrders: Record<string, string[]>;
  index: number;
  items: Record<string, QuestionState>;
  completedAt?: string;
  score?: number;
}
export interface ExerciseDraft {
  answers: Record<string, string>;
  cells: Record<string, string[]>;
}
export interface ConceptCheckpoint {
  version: 1;
  topicId: string;
  sessionId: string;
  run: number;
  score: number;
  independent: number;
  assisted: number;
  total: number;
  time: string;
}
const state = (): QuestionState => ({
  checked: false,
  submissions: 0,
  hintUsed: false,
  revealed: false,
});
export function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items],
    rng = random(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** A checkpoint samples each learning dimension, rather than taking early solver fields. */
export function balancedQuestions(
  questions: PracticeQuestion[],
  perDimension = 2,
  seed = 1,
): PracticeQuestion[] {
  const groups = dimensions.map((dimension, i) =>
    shuffled(
      questions.filter((q) => q.dimension === dimension && q.role !== 'guided'),
      seed + i * 7919,
    ).slice(0, perDimension),
  );
  return Array.from({ length: perDimension }, (_, i) =>
    groups.flatMap((group) => (group[i] ? [group[i]] : [])),
  ).flat();
}
export function createSession(
  topicId: string,
  questions: PracticeQuestion[],
  seed = 1,
  checkpoint = false,
): AssessmentSession {
  const selected = checkpoint ? balancedQuestions(questions, 2, seed) : questions;
  return {
    topicId,
    seed,
    run: seed,
    checkpoint,
    questionIds: selected.map((q) => q.id),
    choiceOrders: Object.fromEntries(
      selected.map((q, i) => [
        q.id,
        shuffled(
          q.choices.map((c) => c.id),
          seed + i * 104729,
        ),
      ]),
    ),
    index: 0,
    items: Object.fromEntries(selected.map((q) => [q.id, state()])),
  };
}
export function compatibleSession(
  session: AssessmentSession | undefined,
  topicId: string,
  questions: PracticeQuestion[],
  checkpoint: boolean,
): session is AssessmentSession {
  return (
    !!session &&
    session.topicId === topicId &&
    session.checkpoint === checkpoint &&
    session.questionIds.length > 0 &&
    session.questionIds.every((id) => {
      const q = questions.find((q) => q.id === id),
        order = session.choiceOrders[id];
      const item = session.items[id];
      return (
        q &&
        order &&
        order.length === q.choices.length &&
        new Set(order).size === order.length &&
        order.every((id) => q.choices.some((c) => c.id === id)) &&
        !!item &&
        (!item.selected || q.choices.some((choice) => choice.id === item.selected)) &&
        (!item.checked || !!item.selected)
      );
    })
  );
}
function event(
  progress: Progress,
  sessionId: string,
  session: AssessmentSession,
  question: PracticeQuestion,
  kind: ConceptAttempt['status'],
  independent = false,
  unassisted = false,
): ConceptAttempt {
  const item = session.items[question.id];
  return {
    eventId: `${sessionId}:${session.run}:${question.id}:${kind === 'hint' || kind === 'revealed' ? kind : item.submissions}`,
    sessionId,
    run: session.run,
    topicId: question.topicId,
    objectiveId: question.objectiveId,
    questionId: question.id,
    dimension: question.dimension,
    role: question.role,
    status: kind,
    selectedChoiceId: item.selected,
    firstSubmission: kind === 'correct' || kind === 'incorrect' ? item.submissions === 1 : false,
    independent,
    unassisted,
    time: new Date().toISOString(),
  };
}
function append(progress: Progress, attempt: ConceptAttempt): boolean {
  progress.conceptAttempts ??= [];
  if (progress.conceptAttempts.some((a) => a.eventId === attempt.eventId)) return false;
  progress.conceptAttempts.push(attempt);
  return true;
}
export function helpQuestion(
  progress: Progress,
  sessionId: string,
  session: AssessmentSession,
  question: PracticeQuestion,
  kind: 'hint' | 'revealed',
): boolean {
  const item = session.items[question.id];
  if (kind === 'hint') item.hintUsed = true;
  else item.revealed = true;
  return append(progress, event(progress, sessionId, session, question, kind));
}
/** Double checks and retries after an explanation cannot manufacture independent evidence. */
export function checkQuestion(
  progress: Progress,
  sessionId: string,
  session: AssessmentSession,
  question: PracticeQuestion,
): ConceptAttempt | undefined {
  const item = session.items[question.id];
  if (item.checked || !question.choices.some((c) => c.id === item.selected)) return undefined;
  const previous = (progress.conceptAttempts ?? []).filter((a) => a.questionId === question.id);
  const correct = item.selected === question.correctChoiceId;
  item.submissions++;
  item.checked = true;
  item.firstCorrect ??= correct;
  const unassisted =
    question.role !== 'guided' && !item.hintUsed && !item.revealed && item.submissions === 1;
  const independent = correct && unassisted && !previous.length;
  const attempt = event(
    progress,
    sessionId,
    session,
    question,
    correct ? 'correct' : 'incorrect',
    independent,
    unassisted,
  );
  append(progress, attempt);
  return attempt;
}
export function retryQuestion(session: AssessmentSession, questionId: string) {
  const item = session.items[questionId];
  item.checked = false;
  item.selected = undefined;
  // Feedback has explained the answer, so retries remain assisted.
  item.revealed = true;
}
export function sessionResult(
  session: AssessmentSession,
  attempts: ConceptAttempt[],
  sessionId: string,
) {
  const events = attempts.filter(
    (a) =>
      a.run === session.run &&
      a.sessionId === sessionId &&
      session.questionIds.includes(a.questionId),
  );
  const first = events.filter((a) => a.firstSubmission);
  const correct = session.questionIds.filter(
    (id) => session.items[id]?.firstCorrect === true,
  ).length;
  const independent = new Set(first.filter((a) => a.independent).map((a) => a.questionId)).size;
  const completed = new Set(events.filter((a) => a.status === 'correct').map((a) => a.questionId))
    .size;
  return {
    total: session.questionIds.length,
    correct,
    score: session.questionIds.length ? correct / session.questionIds.length : 0,
    independent,
    assisted: Math.max(0, completed - independent),
  };
}
export function finishSession(progress: Progress, sessionId: string, session: AssessmentSession) {
  if (!session.questionIds.length || session.index !== session.questionIds.length) return undefined;
  const result = sessionResult(session, progress.conceptAttempts ?? [], sessionId);
  session.completedAt = new Date().toISOString();
  session.score = result.score;
  if (session.checkpoint) {
    progress.conceptCheckpoints ??= {};
    progress.conceptCheckpoints[session.topicId] = {
      version: 1,
      topicId: session.topicId,
      sessionId,
      run: session.run,
      score: result.score,
      independent: result.independent,
      assisted: result.assisted,
      total: result.total,
      time: session.completedAt,
    };
  }
  return result;
}
const dimensionNames: Record<QuestionDimension, string> = {
  definition: 'Definitions & terminology',
  mechanism: 'How it works',
  calculation: 'Calculations & tracing',
  application: 'Financial applications',
};
export function topicSummary(progress: Progress, topic: PracticeTopic) {
  const attempts = (progress.conceptAttempts ?? []).filter((a) => a.topicId === topic.id);
  const answers = attempts.filter((a) => a.status === 'correct' || a.status === 'incorrect');
  const attempted = new Set(answers.map((a) => a.questionId)).size;
  const independentIds = new Set(answers.filter((a) => a.independent).map((a) => a.questionId));
  const assistedIds = new Set(
    answers
      .filter((a) => a.status === 'correct' && !independentIds.has(a.questionId))
      .map((a) => a.questionId),
  );
  const first = answers.filter((a) => a.firstSubmission);
  const objectiveSummaries = topic.objectives.map((objective) => {
    const events = answers.filter((a) => a.objectiveId === objective.id && a.firstSubmission);
    let needsReview = false;
    for (const event of events) {
      if (event.status === 'incorrect') needsReview = true;
      else if (event.role !== 'guided' && (event.unassisted ?? event.independent))
        needsReview = false;
    }
    return {
      ...objective,
      attempted: new Set(events.map((a) => a.questionId)).size,
      independent: new Set(events.filter((a) => a.independent).map((a) => a.questionId)).size,
      needsReview,
    };
  });
  const checkpoint = progress.conceptCheckpoints?.[topic.id]?.score;
  return {
    topicId: topic.id,
    title: topic.title,
    attempted,
    independent: independentIds.size,
    assisted: assistedIds.size,
    accuracy: first.length
      ? first.filter((a) => a.status === 'correct').length / first.length
      : undefined,
    checkpoint,
    status:
      checkpoint !== undefined && checkpoint >= 0.8
        ? ('checkpoint-passed' as const)
        : attempted
          ? ('practicing' as const)
          : ('not-started' as const),
    objectives: objectiveSummaries,
    dimensions: dimensions.map((dimension) => ({
      id: dimension,
      title: dimensionNames[dimension],
      attempted: new Set(answers.filter((a) => a.dimension === dimension).map((a) => a.questionId))
        .size,
      independent: new Set(
        answers.filter((a) => a.dimension === dimension && a.independent).map((a) => a.questionId),
      ).size,
      correct: new Set(
        answers
          .filter((a) => a.dimension === dimension && a.status === 'correct')
          .map((a) => a.questionId),
      ).size,
    })),
    missedQuestionIds: [
      ...new Set(
        answers
          .filter(
            (a) =>
              a.status === 'incorrect' &&
              objectiveSummaries.some((o) => o.id === a.objectiveId && o.needsReview),
          )
          .map((a) => a.questionId),
      ),
    ],
  };
}
export function assessmentSummary(progress: Progress, topics: PracticeTopic[]) {
  const summaries = topics.map((topic) => topicSummary(progress, topic));
  return {
    topics: summaries,
    attempted: summaries.reduce((n, s) => n + s.attempted, 0),
    independent: summaries.reduce((n, s) => n + s.independent, 0),
    assisted: summaries.reduce((n, s) => n + s.assisted, 0),
    checkpointsPassed: summaries.filter((s) => s.status === 'checkpoint-passed').length,
  };
}
export function reviewTopics(progress: Progress, topics: PracticeTopic[]) {
  return topics
    .map((topic) => ({ topic, summary: topicSummary(progress, topic) }))
    .filter(({ summary }) => summary.objectives.some((o) => o.needsReview));
}
export function questionLessonHref(
  topic: PracticeTopic,
  question: PracticeQuestion,
  base = '/',
): string {
  const root = base.replace(/\/$/, '');
  const section = topic.lessons?.find((l) => l.id === question.lessonId)?.section;
  const path =
    topic.kind === 'algorithm'
      ? `/algorithms/${topic.slug}/${section && section !== 'problem' ? section + '/' : ''}`
      : topic.kind === 'measure'
        ? `/measures/${topic.slug}/`
        : `/foundations/${topic.slug}/`;
  return `${root}${path}#${encodeURIComponent(question.lessonId)}`;
}
