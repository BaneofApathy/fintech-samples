import { financialCases } from '../../data/financial-cases';
import type { FinancialCase } from '../../data/financial-cases/types';
export function getStaticPaths() {
  return financialCases.map((scenario) => ({
    params: { id: scenario.visualId },
    props: { scenario },
  }));
}
export function GET({ props }: { props: { scenario: FinancialCase } }) {
  return new Response(JSON.stringify(props.scenario), {
    headers: { 'Content-Type': 'application/json' },
  });
}
