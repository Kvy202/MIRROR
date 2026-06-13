import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archetypeOf, tribeOf, dominantDim, emptyTribeTally, ALL_TRIBES, REVEAL_AT } from '../alignment.js';

const soul = (traits, votesCast = REVEAL_AT) => ({ votesCast, traits });

test('no archetype before the reveal threshold', () => {
  assert.equal(archetypeOf(soul({ warmth: 9 }, REVEAL_AT - 1)), null);
});

test('dominant dimension and direction name the archetype', () => {
  assert.equal(archetypeOf(soul({ warmth: 8, honesty: 1 })), 'The Caregiver');
  assert.equal(archetypeOf(soul({ warmth: -8 })), 'The Stoic');
  assert.equal(archetypeOf(soul({ idealism: 7 })), 'The Romantic');
  assert.equal(archetypeOf(soul({ idealism: -7 })), 'The Realist');
  assert.equal(archetypeOf(soul({ daring: 6 })), 'The Rebel');
  assert.equal(archetypeOf(soul({ honesty: 6 })), 'The Confessor');
});

test('tribe follows the dominant dimension', () => {
  assert.equal(tribeOf(soul({ warmth: 5 })), 'Hearts');
  assert.equal(tribeOf(soul({ honesty: 5 })), 'Seekers');
  assert.equal(tribeOf(soul({ daring: 5 })), 'Rebels');
  assert.equal(tribeOf(soul({ idealism: 5 })), 'Dreamers');
});

test('a soul with no pull has no dominant dimension', () => {
  assert.equal(dominantDim({ warmth: 0, honesty: 0, daring: 0, idealism: 0 }), null);
  assert.equal(tribeOf(soul({ warmth: 0, honesty: 0, daring: 0, idealism: 0 })), null);
});

test('emptyTribeTally zeroes every tribe', () => {
  const t = emptyTribeTally();
  for (const tr of ALL_TRIBES) assert.deepEqual(t[tr], { A: 0, B: 0 });
});
