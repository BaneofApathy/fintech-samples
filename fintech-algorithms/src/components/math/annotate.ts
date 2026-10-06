/** Preserve TeX argument boundaries when adding accessible symbol annotations. */
export function annotateFormula(latex: string, symbols: { symbol: string; meaning: string }[]) {
  const matches = symbols.filter((s) => /^[A-Za-z]+$/.test(s.symbol));
  const meanings = new Map<string, string>();
  const annotated = latex.replace(/\\[a-zA-Z]+|[a-zA-Z]+/g, (token) => {
    if (token.startsWith('\\')) return token;
    const symbol = matches.find((s) => s.symbol === token);
    if (!symbol) return token;
    const id = 's' + meanings.size;
    meanings.set(id, symbol.meaning);
    return `{\\htmlClass{sym-${id}}{${token}}}`;
  });
  return { annotated, meanings };
}
