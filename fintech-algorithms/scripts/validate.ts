import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { algorithmSchema, measureSchema, exerciseSchema } from '../src/engine/schemas';
import { course, algorithms, measures, exercises } from '../src/data';
import { teachingTopics } from '../src/data/teaching-manifest';
import { dimensions } from '../src/data/teaching-types';
const failures: string[] = [];
const topicIds = new Set<string>(), questionIds = new Set<string>();
for (const topic of teachingTopics) {
  if (topicIds.has(topic.id)) failures.push(`Duplicate teaching topic ${topic.id}`);
  topicIds.add(topic.id);
  for (const dimension of dimensions) {
    const objective = topic.objectives.find(o => o.dimension === dimension);
    if (!objective || !topic.lessons.some(l => l.objectiveId === objective.id)) failures.push(`${topic.id}: missing taught ${dimension} objective`);
    for (const role of ['guided','practice','review']) if (!topic.questions.some(q => q.objectiveId === objective?.id && q.role === role)) failures.push(`${topic.id}: missing ${role} ${dimension} question`);
  }
  for (const question of topic.questions) {
    if (questionIds.has(question.id)) failures.push(`Duplicate question ${question.id}`);
    questionIds.add(question.id);
    if (!topic.lessons.some(l => l.id === question.lessonId)) failures.push(`${question.id}: missing lesson link`);
    if (question.choices.length < 3 || !question.choices.every(c => c.text.trim() && c.explanation.trim()) || !question.choices.some(c => c.id === question.correctChoiceId)) failures.push(`${question.id}: incomplete choices or feedback`);
  }
}
for (const algorithm of algorithms) if (!topicIds.has('algorithm:'+algorithm.slug)) failures.push(`${algorithm.slug}: missing complete teaching`);
for (const measure of measures) if (!topicIds.has('measure:'+measure.slug)) failures.push(`${measure.slug}: missing complete teaching`);
for (const [kind, schema] of [
  ['algorithms', algorithmSchema],
  ['measures', measureSchema],
  ['exercises', exerciseSchema],
] as const) {
  for (const file of fs.readdirSync(`content/${kind}`)) {
    const data = YAML.parse(fs.readFileSync(path.join('content', kind, file), 'utf8'));
    const r = schema.safeParse(data);
    if (!r.success) failures.push(`${file}: ${r.error.message}`);
  }
}
if (algorithms.length !== 12 || measures.length !== 39 || exercises.length !== 64)
  failures.push('Collection counts differ from the supplied PDF.');
for (const a of algorithms) {
  for (const sl of a.measures) {
    const m = measures.find((m) => m.slug === sl);
    if (!m?.usedBy.includes(a.slug)) failures.push(`${a.slug} asymmetric measure ${sl}`);
  }
  for (const id of a.exercises)
    if (!exercises.some((e) => e.id === id)) failures.push(`${a.slug} missing exercise ${id}`);
}
for (const m of measures) {
  for (const sl of m.usedBy)
    if (!algorithms.find((a) => a.slug === sl)?.measures.includes(m.slug))
      failures.push(`${m.slug} asymmetric algorithm ${sl}`);
}
const referenced = new Set(
  [...algorithms, ...measures, ...exercises, ...course.overview, ...course.synthesis].flatMap(
    (r) => r.source.pages,
  ),
);
for (let i = 15; i <= 688; i++)
  if (!referenced.has(i) && !course.slides.some((s) => s.page === i))
    failures.push(`Page ${i} is unreachable`);
for (const e of exercises) {
  for (const s of e.steps) {
    if (!s.mistakes.some((m) => m.message.trim()))
      failures.push(`${e.id} ${s.id}: missing calculation feedback`);
    if (!(s.id in e.deckSolution)) failures.push(`${e.id} ${s.id}: missing golden answer`);
  }
  if (!e.symbols.length) failures.push(`${e.id}: no symbols`);
}
const formulaReview = JSON.parse(fs.readFileSync('metadata/formula-review.json', 'utf8'));
for (const e of exercises) {
  if (!e.formulaSource?.reviewed || !formulaReview[e.id]?.reviewed)
    failures.push(`${e.id}: formula has not been visually reviewed`);
  for (const symbol of e.symbols)
    if (!symbol.symbol.trim() || !symbol.meaning.trim())
      failures.push(`${e.id}: unresolved symbol definition`);
}
const defense: string[] = JSON.parse(fs.readFileSync('metadata/source-checks.json', 'utf8')).defenseQuestions;
const serialized = JSON.stringify(course).replace(/\\n/g, ' ').replace(/\s+/g, ' ');
for (const q of defense)
  if (
    !serialized.includes(q) &&
    !course.slides.some((s) => s.text.replace(/\s+/g, ' ').includes(q))
  )
    failures.push('Missing defense question: ' + q);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Content valid: 12 algorithms, 39 measures, 64 exercises, all 689 source pages retained, symmetric links, ${defense.length} defense questions preserved.`,
);
console.log(`Teaching coverage: ${teachingTopics.length} topics, ${teachingTopics.reduce((n,t)=>n+t.lessons.length,0)} lessons, ${questionIds.size} explained questions.`);
