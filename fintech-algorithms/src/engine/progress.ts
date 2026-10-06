import type {
  AssessmentSession,
  ConceptAttempt,
  ConceptCheckpoint,
  ExerciseDraft,
} from './assessment';

export interface Attempt {
  id: string;
  step: string;
  status: 'correct' | 'incorrect' | 'shown';
  pattern?: string;
  seed: number;
  time: string;
}
export interface Progress {
  version: 1;
  sections: Record<string, boolean>;
  answers: Record<string, string>;
  seeds: Record<string, number>;
  attempts: Attempt[];
  checkpoints: Record<string, number>;
  exerciseSteps: Record<string, string[]>;
  resume?: { slug: string; section: string; time: string };
  helpUsed?: Record<string, string[]>;
  conceptAttempts?: ConceptAttempt[];
  conceptCheckpoints?: Record<string, ConceptCheckpoint>;
  assessmentSessions?: Record<string, AssessmentSession>;
  exerciseDrafts?: Record<string, ExerciseDraft>;
  learningActivity?: { id: string; href: string; title: string; time: string };
}
export const empty = (): Progress => ({
  version: 1,
  sections: {},
  answers: {},
  seeds: {},
  attempts: [],
  checkpoints: {},
  exerciseSteps: {},
});
const KEY = 'usf-fintech-progress-v1';
const textValue = (value: unknown, max = 1000): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;
const dateValue = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const plainRecord = (value: unknown, check: (value: unknown) => boolean) =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length < 20000 &&
  Object.values(value).every(check);
const stringArray = (value: unknown) =>
  Array.isArray(value) && value.length < 20000 && value.every((v) => textValue(v));
/** Resume links must remain on this course's origin, including deployment prefixes. */
export function safeActivityHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  try {
    const decoded = decodeURIComponent(value);
    return (
      /^\/(?!\/)/.test(decoded) &&
      !/[\\\u0000-\u0020\u007f]/.test(decoded) &&
      !decoded
        .split(/[?#]/)[0]
        .split('/')
        .some((part) => part === '.' || part === '..') &&
      !decoded.split('#')[0].includes(':')
    );
  } catch {
    return false;
  }
}
function validConceptAttempt(value: unknown): value is ConceptAttempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as ConceptAttempt;
  return (
    [a.eventId, a.sessionId, a.topicId, a.objectiveId, a.questionId].every((v) => textValue(v)) &&
    Number.isSafeInteger(a.run) &&
    a.run >= 0 &&
    ['definition', 'mechanism', 'calculation', 'application'].includes(a.dimension) &&
    ['guided', 'practice', 'review'].includes(a.role) &&
    ['correct', 'incorrect', 'hint', 'revealed'].includes(a.status) &&
    (a.selectedChoiceId === undefined || textValue(a.selectedChoiceId)) &&
    typeof a.firstSubmission === 'boolean' &&
    typeof a.independent === 'boolean' &&
    (a.unassisted === undefined || typeof a.unassisted === 'boolean') &&
    dateValue(a.time) &&
    (!a.independent ||
      (a.status === 'correct' &&
        a.firstSubmission &&
        a.role !== 'guided' &&
        a.unassisted !== false)) &&
    (!a.unassisted ||
      (['correct', 'incorrect'].includes(a.status) && a.firstSubmission && a.role !== 'guided'))
  );
}
function validSession(value: unknown): value is AssessmentSession {
  if (!value || typeof value !== 'object') return false;
  const s = value as AssessmentSession;
  return (
    textValue(s.topicId) &&
    Number.isSafeInteger(s.seed) &&
    s.seed >= 0 &&
    Number.isSafeInteger(s.run) &&
    s.run >= 0 &&
    typeof s.checkpoint === 'boolean' &&
    stringArray(s.questionIds) &&
    new Set(s.questionIds).size === s.questionIds.length &&
    Number.isSafeInteger(s.index) &&
    s.index >= 0 &&
    s.index <= s.questionIds.length &&
    plainRecord(
      s.choiceOrders,
      (value) =>
        stringArray(value) && new Set(value as string[]).size === (value as string[]).length,
    ) &&
    plainRecord(s.items, (value) => {
      if (!value || typeof value !== 'object') return false;
      const item = value as AssessmentSession['items'][string];
      return (
        (item.selected === undefined || textValue(item.selected)) &&
        typeof item.checked === 'boolean' &&
        Number.isSafeInteger(item.submissions) &&
        item.submissions >= 0 &&
        typeof item.hintUsed === 'boolean' &&
        typeof item.revealed === 'boolean' &&
        (item.firstCorrect === undefined || typeof item.firstCorrect === 'boolean')
      );
    }) &&
    s.questionIds.every((id) => Object.hasOwn(s.items, id) && Object.hasOwn(s.choiceOrders, id)) &&
    (s.completedAt === undefined || dateValue(s.completedAt)) &&
    (s.score === undefined || (Number.isFinite(s.score) && s.score >= 0 && s.score <= 1))
  );
}
function validConceptCheckpoint(value: unknown): value is ConceptCheckpoint {
  if (!value || typeof value !== 'object') return false;
  const c = value as ConceptCheckpoint;
  return (
    c.version === 1 &&
    [c.topicId, c.sessionId].every((v) => textValue(v)) &&
    Number.isSafeInteger(c.run) &&
    c.run >= 0 &&
    Number.isFinite(c.score) &&
    c.score >= 0 &&
    c.score <= 1 &&
    Number.isSafeInteger(c.total) &&
    c.total > 0 &&
    c.total < 20000 &&
    Number.isSafeInteger(c.independent) &&
    c.independent >= 0 &&
    Number.isSafeInteger(c.assisted) &&
    c.assisted >= 0 &&
    c.independent + c.assisted <= c.total &&
    dateValue(c.time)
  );
}
export function read(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    return valid(p) ? p : empty();
  } catch {
    return empty();
  }
}
export function valid(p: unknown): p is Progress {
  if (!p || typeof p !== 'object') return false;
  const x = p as Progress;
  const record = (v: unknown, check: (x: unknown) => boolean) =>
    !!v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.keys(v).length < 20000 &&
    Object.values(v).every(check);
  return (
    x.version === 1 &&
    (x.learningActivity === undefined ||
      (textValue(x.learningActivity?.id) &&
        textValue(x.learningActivity?.title, 500) &&
        safeActivityHref(x.learningActivity?.href) &&
        dateValue(x.learningActivity?.time))) &&
    (x.conceptAttempts === undefined ||
      (Array.isArray(x.conceptAttempts) &&
        x.conceptAttempts.length < 200000 &&
        x.conceptAttempts.every(validConceptAttempt) &&
        new Set(x.conceptAttempts.map((a) => a.eventId)).size === x.conceptAttempts.length)) &&
    (x.assessmentSessions === undefined || plainRecord(x.assessmentSessions, validSession)) &&
    (x.conceptCheckpoints === undefined ||
      (plainRecord(x.conceptCheckpoints, validConceptCheckpoint) &&
        Object.entries(x.conceptCheckpoints).every(
          ([id, checkpoint]) => id === checkpoint.topicId,
        ))) &&
    (x.exerciseDrafts === undefined ||
      plainRecord(x.exerciseDrafts, (value) => {
        if (!value || typeof value !== 'object') return false;
        const draft = value as ExerciseDraft;
        return (
          plainRecord(draft.answers, (v) => typeof v === 'string' && v.length < 100000) &&
          plainRecord(
            draft.cells,
            (v) =>
              Array.isArray(v) &&
              v.length < 20000 &&
              v.every((cell) => typeof cell === 'string' && cell.length < 100000),
          )
        );
      })) &&
    (x.resume === undefined ||
      (!!x.resume &&
        typeof x.resume === 'object' &&
        typeof x.resume.slug === 'string' &&
        /^[a-z0-9-]{1,80}$/.test(x.resume.slug) &&
        ['problem', 'intuition', 'formula', 'worked', 'practice', 'measures', 'defend'].includes(
          x.resume.section,
        ) &&
        typeof x.resume.time === 'string' &&
        !Number.isNaN(Date.parse(x.resume.time)))) &&
    record(x.sections, (v) => typeof v === 'boolean') &&
    record(x.answers, (v) => typeof v === 'string' && v.length < 100000) &&
    record(x.seeds, (v) => Number.isSafeInteger(v)) &&
    record(x.checkpoints, (v) => typeof v === 'number' && v >= 0 && v <= 1) &&
    record(x.exerciseSteps, (v) => Array.isArray(v) && v.every((s) => typeof s === 'string')) &&
    (x.helpUsed === undefined ||
      record(x.helpUsed, (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'))) &&
    Array.isArray(x.attempts) &&
    x.attempts.length < 200000 &&
    x.attempts.every(
      (a) =>
        a &&
        typeof a.id === 'string' &&
        typeof a.step === 'string' &&
        ['correct', 'incorrect', 'shown'].includes(a.status) &&
        Number.isSafeInteger(a.seed) &&
        typeof a.time === 'string' &&
        (a.pattern === undefined || typeof a.pattern === 'string'),
    )
  );
}
export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('course-progress', { detail: p }));
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent('course-storage-error'));
    return false;
  }
}
export function recordActivity(activity: { id: string; href: string; title: string }) {
  if (
    !textValue(activity.id) ||
    !textValue(activity.title, 500) ||
    !safeActivityHref(activity.href)
  )
    return false;
  const p = read();
  p.learningActivity = { ...activity, time: new Date().toISOString() };
  return save(p);
}
export function saveExerciseDraft(key: string, draft: ExerciseDraft) {
  const p = read();
  p.exerciseDrafts ??= {};
  p.exerciseDrafts[key] = {
    answers: { ...draft.answers },
    cells: Object.fromEntries(Object.entries(draft.cells).map(([id, cells]) => [id, [...cells]])),
  };
  return save(p);
}
export function clearExerciseDraft(key: string) {
  const p = read();
  if (p.exerciseDrafts) delete p.exerciseDrafts[key];
  return save(p);
}
export function mark(section: string, done = true) {
  const p = read();
  p.sections[section] = done;
  save(p);
}
export function visit(slug: string, section: string) {
  if (
    !/^[a-z0-9-]{1,80}$/.test(slug) ||
    !['problem', 'intuition', 'formula', 'worked', 'practice', 'measures', 'defend'].includes(
      section,
    )
  )
    return;
  const p = read();
  p.resume = { slug, section, time: new Date().toISOString() };
  save(p);
}

/** Count distinct steps by exercise and seed; a revealed step stays assisted. */
export function practiceSummary(attempts: Attempt[], helpUsed: Record<string, string[]> = {}) {
  const steps = new Map<string, { correct: boolean; shown: boolean }>();
  for (const a of attempts) {
    const key = JSON.stringify([a.id, a.seed, a.step]);
    const state = steps.get(key) ?? { correct: false, shown: false };
    state.correct ||= a.status === 'correct';
    state.shown ||=
      a.status === 'shown' ||
      (a.status === 'correct' &&
        (['hint-used', 'solution-viewed'].includes(a.pattern ?? '') ||
          !!helpUsed[a.id + ':' + a.seed]?.includes(a.step)));
    steps.set(key, state);
  }
  return {
    independent: [...steps.values()].filter((s) => s.correct && !s.shown).length,
    assisted: [...steps.values()].filter((s) => s.shown).length,
  };
}
export function noteHelp(id: string, seed: number, step: string) {
  const p = read();
  p.helpUsed ??= {};
  const key = id + ':' + seed;
  p.helpUsed[key] = [...new Set([...(p.helpUsed[key] ?? []), step])];
  save(p);
}
export function response(key: string, value: string) {
  const p = read();
  p.answers[key] = value;
  save(p);
}
export function attempt(a: Omit<Attempt, 'time'>) {
  const p = read();
  p.attempts.push({ ...a, time: new Date().toISOString() });
  if (a.status === 'correct' || a.status === 'shown') {
    const key = a.id + ':' + a.seed;
    p.exerciseSteps[key] = [...new Set([...(p.exerciseSteps[key] || []), a.step])];
  }
  save(p);
}
export function download(name: string, text: string, type = 'application/json') {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function exportProgress() {
  download('fintech-progress.json', JSON.stringify(read(), null, 2));
}
export function importProgress(text: string) {
  const p = JSON.parse(text);
  if (!valid(p)) throw new Error('This file does not contain compatible course progress.');
  save(p);
}
export function analyticsCSV() {
  const rows = [
    ['exercise', 'step', 'status', 'mistake', 'seed', 'timestamp'],
    ...read().attempts.map((a) => [
      a.id,
      a.step,
      a.status,
      a.pattern || '',
      String(a.seed),
      a.time,
    ]),
  ];
  download(
    'fintech-attempts.csv',
    rows.map((r) => r.map((c) => '"' + c.replaceAll('"', '""') + '"').join(',')).join('\n'),
    'text/csv',
  );
}
export function conceptAnalyticsCSV() {
  const rows = [
    [
      'topic',
      'objective',
      'dimension',
      'question',
      'status',
      'selected_choice',
      'independent',
      'unassisted_retrieval',
      'session',
      'run',
      'timestamp',
    ],
    ...(read().conceptAttempts ?? []).map((a) => [
      a.topicId,
      a.objectiveId,
      a.dimension,
      a.questionId,
      a.status,
      a.selectedChoiceId ?? '',
      String(a.independent),
      a.unassisted === undefined ? '' : String(a.unassisted),
      a.sessionId,
      String(a.run),
      a.time,
    ]),
  ];
  download(
    'fintech-concept-attempts.csv',
    rows
      .map((row) => row.map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(','))
      .join('\n'),
    'text/csv',
  );
}
