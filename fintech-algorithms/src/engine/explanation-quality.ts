const knownFiller = [
  /identify each supplied value, perform the operation shown/i,
  /turns the supplied inputs into .* first identify the values/i,
  /compare your operation and units with the worked method/i,
  /read this expression from left to right/i,
];

/** Reject empty copy and the known generic fallbacks that previously hid missing authorship. */
export function isSubstantiveExplanation(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 25 && !knownFiller.some((pattern) => pattern.test(value));
}
