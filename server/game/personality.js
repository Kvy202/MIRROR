// The collective heart drifts from the answers themselves: every verdict nudges
// the four dimensions toward the winning option's tagged values (see
// consequences.js). This module just provides the shared scale and the chapter
// the story is currently in.

import { TUNING } from './tuning.js';

// How hard a verdict shapes the heart — gentle for a coin-flip, strong for a
// near-unanimous answer, times the master magnitude dial.
export function heartScale(marginFraction = 0) {
  const { magnitude, scaleMin, scaleRange } = TUNING.heart;
  return (scaleMin + marginFraction * scaleRange) * magnitude;
}

// Humanity's story moves through named chapters as the rounds accumulate.
export function chapterFor(age) {
  for (const { until, name } of TUNING.chapters) {
    if (age < until) return name;
  }
  return TUNING.chapters[TUNING.chapters.length - 1].name;
}
