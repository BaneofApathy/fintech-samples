export type LessonBlock =
  | { kind: 'code'; code: string; language?: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | {
      kind: 'math';
      latex: string;
      readAloud?: string;
      symbols?: { symbol: string; meaning: string }[];
    }
  | { kind: 'visual'; category: 'algorithm' | 'measure' | 'foundation' | 'supplement'; visualId: string; exampleId?: string; focus?: string };

export interface LessonSection {
  title: string;
  blocks: LessonBlock[];
}

export interface AlgorithmLesson {
  available: string;
  costs: string;
  decision: string;
  method: LessonSection[];
  worked: LessonSection[];
  evaluation: LessonSection[];
}
