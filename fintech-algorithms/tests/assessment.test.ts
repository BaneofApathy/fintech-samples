import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dimensions, type PracticeQuestion } from '../src/data/teaching-types';
import {
  assessmentSummary,
  balancedQuestions,
  checkQuestion,
  compatibleSession,
  createSession,
  finishSession,
  helpQuestion,
  questionLessonHref,
  retryQuestion,
  reviewTopics,
  sessionResult,
  shuffled,
  topicSummary,
  type PracticeTopic,
} from '../src/engine/assessment';
import {
  empty,
  importProgress,
  read,
  recordActivity,
  safeActivityHref,
  save,
  saveExerciseDraft,
  valid,
} from '../src/engine/progress';

const topic: PracticeTopic = {
  id: 'algorithm:example',
  kind: 'algorithm',
  slug: 'example',
  title: 'Example algorithm',
  objectives: dimensions.map((dimension) => ({
    id: `objective:${dimension}`,
    dimension,
    title: dimension,
    description: `Understand ${dimension}.`,
  })),
  lessons: [{ id: 'example:formula', section: 'formula' }],
};
const questions: PracticeQuestion[] = dimensions.flatMap((dimension) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `${dimension}:${i}`,
    topicId: topic.id,
    objectiveId: `objective:${dimension}`,
    dimension,
    difficulty: 'standard' as const,
    role: 'practice' as const,
    prompt: `Explain ${dimension} ${i}.`,
    choices: [
      { id: 'right', text: 'Correct option', explanation: 'This follows the method.' },
      { id: 'wrong', text: 'Wrong option', explanation: 'This confuses the denominator.' },
      { id: 'other', text: 'Another misconception', explanation: 'This confuses the units.' },
    ],
    correctChoiceId: 'right',
    hint: 'Identify the required population.',
    explanation: 'Use the stated quantities and units.',
    lessonId: 'example:formula',
  })),
);

describe('Authored conceptual assessment', () => {
  it('shuffles stable choice IDs deterministically without changing the answers', () => {
    expect(shuffled(['a', 'b', 'c', 'd'], 7)).toEqual(shuffled(['a', 'b', 'c', 'd'], 7));
    const p = empty(),
      s = createSession(topic.id, questions, 12);
    expect(s.choiceOrders).toEqual(createSession(topic.id, questions, 12).choiceOrders);
    for (const q of questions) {
      expect(new Set(s.choiceOrders[q.id])).toEqual(new Set(q.choices.map((c) => c.id)));
      s.items[q.id].selected = q.correctChoiceId;
      expect(checkQuestion(p, 'practice', s, q)).toMatchObject({
        status: 'correct',
        independent: true,
      });
    }
  });
  it('selects two questions in every dimension and excludes already guided examples', () => {
    const bank = [...questions, { ...questions[0], id: 'guided', role: 'guided' as const }];
    const selected = balancedQuestions(bank, 2, 8);
    expect(selected).toHaveLength(8);
    for (const dimension of dimensions)
      expect(selected.filter((q) => q.dimension === dimension)).toHaveLength(2);
    expect(selected.every((q) => q.role !== 'guided')).toBe(true);
    expect(selected).toEqual(balancedQuestions(bank, 2, 8));
    expect(selected.map((q) => q.id)).not.toEqual(balancedQuestions(bank, 2, 9).map((q) => q.id));
  });
  it('deduplicates repeated checks and does not inflate score or independent evidence on retries', () => {
    const p = empty(),
      s = createSession(topic.id, [questions[0]]),
      q = questions[0];
    s.items[q.id].selected = 'wrong';
    expect(checkQuestion(p, 'practice', s, q)?.status).toBe('incorrect');
    expect(checkQuestion(p, 'practice', s, q)).toBeUndefined();
    expect(p.conceptAttempts).toHaveLength(1);
    retryQuestion(s, q.id);
    s.items[q.id].selected = 'right';
    expect(checkQuestion(p, 'practice', s, q)).toMatchObject({
      status: 'correct',
      independent: false,
      firstSubmission: false,
    });
    expect(sessionResult(s, p.conceptAttempts!, 'practice')).toMatchObject({
      correct: 0,
      score: 0,
      independent: 0,
    });
    expect(topicSummary(p, topic)).toMatchObject({ independent: 0, assisted: 1 });
  });
  it('records hints and reveals immediately, including after refresh or session restart', () => {
    for (const kind of ['hint', 'revealed'] as const) {
      const p = empty(),
        q = questions[0],
        s = createSession(topic.id, [q]);
      expect(helpQuestion(p, 'practice', s, q, kind)).toBe(true);
      expect(helpQuestion(p, 'practice', s, q, kind)).toBe(false);
      const restored = JSON.parse(JSON.stringify(s));
      restored.items[q.id].selected = 'right';
      expect(checkQuestion(p, 'practice', restored, q)?.independent).toBe(false);
      const fresh = createSession(topic.id, [q], 2);
      fresh.items[q.id].selected = 'right';
      expect(checkQuestion(p, 'practice', fresh, q)?.independent).toBe(false);
    }
  });
  it('keeps guided checks useful without counting them as independent', () => {
    const p = empty(),
      q = { ...questions[0], role: 'guided' as const },
      s = createSession(topic.id, [q]);
    s.items[q.id].selected = 'right';
    expect(checkQuestion(p, 'inline', s, q)).toMatchObject({
      status: 'correct',
      independent: false,
    });
  });
  it('keeps the missed objective in review until a fresh authored question demonstrates it', () => {
    const p = empty(),
      q = questions[0],
      fresh = questions[1],
      s = createSession(topic.id, [q, fresh]);
    s.items[q.id].selected = 'wrong';
    checkQuestion(p, 'practice', s, q);
    expect(reviewTopics(p, [topic])).toHaveLength(1);
    retryQuestion(s, q.id);
    s.items[q.id].selected = 'right';
    checkQuestion(p, 'practice', s, q);
    expect(reviewTopics(p, [topic])).toHaveLength(1);
    s.items[fresh.id].selected = 'right';
    checkQuestion(p, 'practice', s, fresh);
    expect(reviewTopics(p, [topic])).toHaveLength(0);
    p.conceptCheckpoints = {
      [topic.id]: {
        version: 1,
        topicId: topic.id,
        sessionId: 'checkpoint',
        run: 1,
        score: 0.875,
        independent: 7,
        assisted: 0,
        total: 8,
        time: new Date().toISOString(),
      },
    };
    expect(topicSummary(p, topic).status).toBe('checkpoint-passed');
    expect(assessmentSummary(p, [topic])).toMatchObject({
      independent: 1,
      assisted: 1,
      checkpointsPassed: 1,
    });
  });
  it('separates results of different sessions that use the same questions and seed', () => {
    const p = empty(),
      q = questions[0],
      first = createSession(topic.id, [q]),
      second = createSession(topic.id, [q]);
    first.items[q.id].selected = 'right';
    checkQuestion(p, 'guided-practice', first, q);
    second.items[q.id].selected = 'right';
    checkQuestion(p, 'checkpoint', second, q);
    expect(sessionResult(first, p.conceptAttempts!, 'guided-practice').independent).toBe(1);
    expect(sessionResult(second, p.conceptAttempts!, 'checkpoint').independent).toBe(0);
  });
  it('clears a finite-bank review after successful later retrieval without creating independent novelty', () => {
    const p = empty(),
      q = questions[0],
      first = createSession(topic.id, [q]);
    first.items[q.id].selected = 'wrong';
    checkQuestion(p, 'practice', first, q);
    retryQuestion(first, q.id);
    first.items[q.id].selected = 'right';
    expect(checkQuestion(p, 'practice', first, q)).toMatchObject({
      independent: false,
      unassisted: false,
      firstSubmission: false,
    });
    expect(reviewTopics(p, [topic])).toHaveLength(1);
    const later = createSession(topic.id, [q], 2);
    later.items[q.id].selected = 'right';
    expect(checkQuestion(p, 'practice', later, q)).toMatchObject({
      independent: false,
      unassisted: true,
      firstSubmission: true,
    });
    expect(reviewTopics(p, [topic])).toHaveLength(0);
    expect(topicSummary(p, topic).independent).toBe(0);
    expect(valid(p)).toBe(true);
    const oldEvents = structuredClone(p);
    for (const event of oldEvents.conceptAttempts!) delete event.unassisted;
    expect(valid(oldEvents)).toBe(true);
  });
  it('keeps legacy numerical checkpoint grades separate from authored conceptual results', () => {
    const p = empty();
    p.checkpoints[topic.slug] = 0.9;
    expect(topicSummary(p, topic)).toMatchObject({ checkpoint: undefined, status: 'not-started' });
    expect(assessmentSummary(p, [topic]).checkpointsPassed).toBe(0);
    const s = createSession(topic.id, questions, 1, true);
    for (const id of s.questionIds) {
      const q = questions.find((q) => q.id === id)!;
      s.items[id].selected = 'right';
      checkQuestion(p, 'checkpoint', s, q);
      s.index++;
    }
    finishSession(p, 'checkpoint', s);
    expect(p.checkpoints[topic.slug]).toBe(0.9);
    expect(p.conceptCheckpoints?.[topic.id]).toMatchObject({ version: 1, score: 1, total: 8 });
    expect(topicSummary(p, topic)).toMatchObject({ checkpoint: 1, status: 'checkpoint-passed' });
    expect(valid(p)).toBe(true);
    expect(
      valid({
        ...p,
        conceptCheckpoints: { [topic.id]: { ...p.conceptCheckpoints![topic.id], version: 9 } },
      }),
    ).toBe(false);
  });
  it('builds lesson links for algorithms, measures and dedicated foundation pages with deployment prefixes', () => {
    expect(questionLessonHref(topic, questions[0], '/course/')).toBe(
      '/course/algorithms/example/formula/#example%3Aformula',
    );
    expect(questionLessonHref({ ...topic, kind: 'measure' }, questions[0])).toBe(
      '/measures/example/#example%3Aformula',
    );
    expect(questionLessonHref({ ...topic, kind: 'foundation' }, questions[0])).toBe(
      '/foundations/example/#example%3Aformula',
    );
  });
});

describe('Optional v1 learning state and numeric drafts', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('preserves every original field when importing legacy progress and adding a concept session', () => {
    const legacy = {
      ...empty(),
      answers: { defense: 'Written work' },
      seeds: { 'A01:practice': 9 },
      sections: { 'example:problem': true },
      checkpoints: { example: 0.8 },
      exerciseSteps: { 'A01:9': ['z'] },
      attempts: [{ id: 'A01', step: 'z', status: 'correct' as const, seed: 9, time: '2026-10-01' }],
    };
    importProgress(JSON.stringify(legacy));
    const p = read(),
      s = createSession(topic.id, questions, 4);
    s.items[questions[0].id].selected = 'right';
    s.index = 0;
    p.assessmentSessions = { practice: s };
    checkQuestion(p, 'practice', s, questions[0]);
    expect(valid(p)).toBe(true);
    save(p);
    for (const [key, value] of Object.entries(legacy))
      expect(read()[key as keyof typeof legacy]).toEqual(value);
    expect(compatibleSession(read().assessmentSessions?.practice, topic.id, questions, false)).toBe(
      true,
    );
    expect(read().assessmentSessions?.practice).toEqual(s);
    expect(read().conceptAttempts).toHaveLength(1);
  });
  it('saves partial numeric and cell drafts without marking steps complete', () => {
    saveExerciseDraft('M01:practice:3', {
      answers: { precision: '12/' },
      cells: { cells: ['2', '', '3'] },
    });
    expect(read().exerciseDrafts?.['M01:practice:3']).toEqual({
      answers: { precision: '12/' },
      cells: { cells: ['2', '', '3'] },
    });
    expect(read().attempts).toEqual([]);
    expect(read().exerciseSteps).toEqual({});
  });
  it('validates optional state and rejects malformed imports without replacing saved data', () => {
    const p = empty();
    p.assessmentSessions = { practice: createSession(topic.id, questions) };
    save(p);
    const malformed = structuredClone(p);
    malformed.assessmentSessions!.practice.index = 99;
    expect(() => importProgress(JSON.stringify(malformed))).toThrow('compatible');
    expect(read()).toEqual(p);
    expect(valid({ ...p, exerciseDrafts: { broken: { answers: [], cells: {} } } })).toBe(false);
  });
  it('allows canonical local lesson links and rejects external, encoded network and traversal links', () => {
    for (const href of ['/course/foundations/example/#example:definition', '/measures/recall/#M03'])
      expect(safeActivityHref(href)).toBe(true);
    for (const href of [
      'https://evil.example',
      '//evil.example',
      '/%2fexample.com',
      '/\\example.com',
      '/../../file',
      '/%2e%2e/file',
      '/javascript:alert(1)',
      '/foo%0abar',
    ])
      expect(safeActivityHref(href)).toBe(false);
    expect(
      recordActivity({
        id: topic.id,
        href: '/course/algorithms/example/formula/#example:formula',
        title: topic.title,
      }),
    ).toBe(true);
    expect(read().learningActivity).toMatchObject({ id: topic.id, title: topic.title });
    const previous = read();
    expect(recordActivity({ id: topic.id, href: '//evil.example', title: topic.title })).toBe(
      false,
    );
    expect(read()).toEqual(previous);
  });
  it('reports storage failure without throwing or claiming that a write succeeded', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    });
    expect(save(empty())).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'course-storage-error' }),
    );
  });
});
