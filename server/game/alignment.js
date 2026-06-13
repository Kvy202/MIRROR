// The mirror reading a soul. A soul accumulates pull on four heart dimensions
// from the answers it chooses; the dominant dimension (and its direction) names
// its archetype, and the dominant dimension alone names its tribe (for the live
// tug-of-war). All cutoffs live in game/tuning.js.

import { TUNING } from './tuning.js';

export const REVEAL_AT = TUNING.revealAt;

export const DIMS = ['warmth', 'honesty', 'daring', 'idealism'];

// Four tribes, one per dominant dimension — clean enough for a live tug-of-war.
export const TRIBES = ['Hearts', 'Seekers', 'Rebels', 'Dreamers'];
export const ALL_TRIBES = [...TRIBES, 'Unaligned'];

const DIM_TO_TRIBE = { warmth: 'Hearts', honesty: 'Seekers', daring: 'Rebels', idealism: 'Dreamers' };

// Eight archetypes — the dimension that pulls hardest, and which way.
const ARCHETYPE = {
  warmth: { pos: 'The Caregiver', neg: 'The Stoic' },
  honesty: { pos: 'The Confessor', neg: 'The Diplomat' },
  daring: { pos: 'The Rebel', neg: 'The Guardian' },
  idealism: { pos: 'The Romantic', neg: 'The Realist' },
};

export function emptyTribeTally() {
  const t = {};
  for (const tribe of ALL_TRIBES) t[tribe] = { A: 0, B: 0 };
  return t;
}

// The dimension a soul is pulled toward most strongly (by absolute magnitude).
export function dominantDim(traits) {
  if (!traits) return null;
  let best = null;
  let bestMag = 0;
  for (const dim of DIMS) {
    const mag = Math.abs(traits[dim] ?? 0);
    if (mag > bestMag) {
      bestMag = mag;
      best = dim;
    }
  }
  return bestMag === 0 ? null : best;
}

export function archetypeOf(soul) {
  if ((soul?.votesCast ?? 0) < REVEAL_AT) return null;
  const dim = dominantDim(soul.traits);
  if (!dim) return null;
  return (soul.traits[dim] >= 0 ? ARCHETYPE[dim].pos : ARCHETYPE[dim].neg);
}

export function tribeOf(soul) {
  if ((soul?.votesCast ?? 0) < REVEAL_AT) return null;
  const dim = dominantDim(soul.traits);
  return dim ? DIM_TO_TRIBE[dim] : null;
}
