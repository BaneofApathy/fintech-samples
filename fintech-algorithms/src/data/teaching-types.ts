import type { LessonBlock, LessonSection } from './lesson-types';

export const dimensions = ['definition', 'mechanism', 'calculation', 'application'] as const;
export type QuestionDimension = (typeof dimensions)[number];
export type TeachingStage =
  | 'problem'
  | 'intuition'
  | 'formula'
  | 'worked'
  | 'practice'
  | 'measures'
  | 'defend'
  | 'learn'
  | 'calculate'
  | 'interpret';
export interface LearningObjective {
  id: string;
  dimension: QuestionDimension;
  title: string;
  description: string;
}
export interface PracticeChoice {
  id: string;
  text: string;
  explanation: string;
}
export interface PracticeQuestion {
  id: string;
  topicId: string;
  objectiveId: string;
  dimension: QuestionDimension;
  difficulty: 'introductory' | 'standard' | 'challenge';
  role: 'guided' | 'practice' | 'review';
  prompt: string;
  choices: PracticeChoice[];
  correctChoiceId: string;
  hint: string;
  explanation: string;
  lessonId: string;
}
export interface ConceptTerm {
  term: string;
  definition: string;
  example: string;
}
export interface TeachingLesson {
  id: string;
  title: string;
  section: TeachingStage;
  objectiveId: string;
  blocks: LessonBlock[];
  advanced?: LessonSection[];
}
export interface TeachingTopic {
  id: string;
  kind: 'algorithm' | 'measure' | 'foundation';
  slug: string;
  title: string;
  definition: string;
  preciseDefinition: string;
  prerequisites: string[];
  terms: ConceptTerm[];
  objectives: LearningObjective[];
  lessons: TeachingLesson[];
  questions: PracticeQuestion[];
  pseudocode?: string;
  codeWalkthrough?: { operation: string; explanation: string }[];
  complexity?: string;
}
