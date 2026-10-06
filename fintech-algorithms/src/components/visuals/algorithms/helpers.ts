export const number = (value: unknown, digits = 2) =>
  Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
export const percent = (value: unknown, digits = 1) => `${number(Number(value) * 100, digits)}%`;
export const money = (value: unknown) => `$${number(value, 0)}`;
export function plotLine(
  values: number[],
  x0 = 45,
  y0 = 265,
  width = 460,
  height = 205,
  domain?: [number, number],
) {
  const lo = domain?.[0] ?? Math.min(0, ...values),
    hi = domain?.[1] ?? Math.max(1, ...values);
  return values
    .map(
      (v, i) =>
        `${i ? 'L' : 'M'}${x0 + (i * width) / Math.max(1, values.length - 1)},${y0 - ((v - lo) / (hi - lo || 1)) * height}`,
    )
    .join(' ');
}
