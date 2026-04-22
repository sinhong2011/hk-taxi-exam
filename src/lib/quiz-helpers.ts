// Shared pure helpers used by Quiz.tsx (casual) and the mock-mode banks.
// No React, no DOM, no localStorage — safe to import from anywhere.

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickDistractors<T>(
  pool: T[],
  correct: T,
  count: number,
  keyOf: (x: T) => string,
): T[] {
  const k = keyOf(correct);
  const candidates = pool.filter((x) => keyOf(x) !== k);
  return shuffle(candidates).slice(0, count);
}
