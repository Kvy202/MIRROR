// Presentation metadata for the mirror's reading of a soul. The server decides
// WHICH archetype (server/game/alignment.js); this is how each is shown in the
// "it has been reading me" moment. Eight archetypes — one per heart dimension,
// each with a direction.

export const ARCHETYPES = {
  'The Caregiver': { color: '#ff6b9d', blurb: 'You move toward people. You would rather feel too much than too little.' },
  'The Stoic': { color: '#7da0c0', blurb: 'You hold yourself steady. You have learned to feel less, and so to break less.' },
  'The Confessor': { color: '#18e0ff', blurb: 'You choose the truth, even when it cuts. You would rather know than be soothed.' },
  'The Diplomat': { color: '#9ad6c0', blurb: 'You protect the hearts around you. A kind silence over a sharp truth.' },
  'The Rebel': { color: '#ff5d3c', blurb: 'You leap. Where the crowd hesitates, you have already jumped.' },
  'The Guardian': { color: '#c0a062', blurb: 'You keep what matters safe. You would rather be sure than be sorry.' },
  'The Romantic': { color: '#b061ff', blurb: 'You chase meaning and love over comfort and gold. The dream is worth the fall.' },
  'The Realist': { color: '#8c97a8', blurb: 'You see what is, not what you wish. You build on solid ground.' },
};

export function archetypeMeta(name) {
  return ARCHETYPES[name] ?? { color: '#9aa', blurb: '' };
}

// Each archetype's mirror-opposite (same dimension, opposite direction).
const OPPOSITE = {
  'The Caregiver': 'The Stoic',
  'The Stoic': 'The Caregiver',
  'The Confessor': 'The Diplomat',
  'The Diplomat': 'The Confessor',
  'The Rebel': 'The Guardian',
  'The Guardian': 'The Rebel',
  'The Romantic': 'The Realist',
  'The Realist': 'The Romantic',
};

export function oppositeArchetype(name) {
  return OPPOSITE[name] ?? null;
}

// The four tribes (by dominant heart dimension) for the live tug-of-war.
export const TRIBES = {
  Hearts: { color: '#ff6b9d', sub: 'led by warmth' },
  Seekers: { color: '#18e0ff', sub: 'led by truth' },
  Rebels: { color: '#ff5d3c', sub: 'led by daring' },
  Dreamers: { color: '#b061ff', sub: 'led by idealism' },
};

export function tribeMeta(name) {
  return TRIBES[name] ?? { color: '#9aa', sub: '' };
}
