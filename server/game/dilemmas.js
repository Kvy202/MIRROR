// A tiny, always-safe fallback question used only if the generator ever throws.
// Carries the same shape as a generated question (value-tagged A/B options).
const t = (warmth = 0, honesty = 0, daring = 0, idealism = 0) => ({ warmth, honesty, daring, idealism });

export function fallbackQuestion() {
  return {
    category: 'truth',
    prompt: 'Tell the next stranger who arrives here —',
    optionA: 'the truth',
    optionB: 'a comforting lie',
    A: { traits: t(0, 2, 0, 0), reveal: 'The crowd chose the truth.', confession: 'truth' },
    B: { traits: t(1, -2, 0, 0), reveal: 'The crowd chose comfort.', confession: 'lie' },
  };
}
