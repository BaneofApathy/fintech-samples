import type { Givens } from '../engine/types';
export const supplementVisuals: {
  id: string;
  title: string;
  question: string;
  takeaway: string;
  givens: Givens;
}[] = [
  {
    id: 'S01',
    title: 'Check the table before trusting the number',
    question: 'What happens when extraction drops the unit or period?',
    takeaway:
      'An intact number can still be wrong evidence if its header, unit, or period is missing.',
    givens: { tables: 8, intact: 7, sections: 10, present: 9, cells: 200, wrong: 6 },
  },
  {
    id: 'S02',
    title: 'Correct statements can leave the question unanswered',
    question: 'Did the response supply every required component?',
    takeaway:
      'Answer-level exactness and component-level completeness have different denominators.',
    givens: { required: [2, 3, 1, 4], correct: [2, 2, 0, 4] },
  },
  {
    id: 'S03',
    title: 'Keep the unfilled shares in the picture',
    question: 'What do the filled and unfinished shares each contribute to the order’s cost?',
    takeaway:
      'Compare the full intended order with the arrival-price benchmark. Count extra price paid on filled shares, fees, and an estimated opportunity cost for shares left unfilled. Show completion too; this benchmark estimate is not a fee.',
    givens: {
      target: 1000,
      arrival: 50,
      shares: [400, 400],
      prices: [50.1, 50.2],
      close: 50.3,
      fees: 20,
    },
  },
  {
    id: 'S04',
    title: 'Inspect the executions behind the average',
    question: 'Can average cost improve even when the most expensive executions get worse?',
    takeaway:
      'An average summarizes every order, while a tail measure focuses on the most expensive ones. Compare both policies on the same orders, and treat a ten-order tail as a teaching example rather than a reliable forecast.',
    givens: { costs: [2, 3, 4, 5, 6, 7, 8, 9, 20, 30], baseline: 12, tail: 0.2 },
  },
];
