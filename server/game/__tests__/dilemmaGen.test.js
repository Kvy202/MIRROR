import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion, approxVariety } from '../dilemmaGen.js';

test('every question is complete and value-tagged on both options', () => {
  for (let i = 0; i < 1500; i++) {
    const q = generateQuestion({ hope: 50, heart: {} });
    assert.ok(q.prompt && q.optionA && q.optionB, 'has prompt + both options');
    assert.ok(q.category, 'has a category');
    for (const side of ['A', 'B']) {
      const s = q[side];
      assert.ok(s, `${side} spec exists`);
      assert.ok(s.reset || s.traits, `${side} has traits (or is a reset)`);
      assert.ok(typeof s.reveal === 'string' && s.reveal.length, `${side} has a reflection line`);
    }
  }
});

test('the engine poses real variety, not a tiny loop', () => {
  const seen = new Set();
  for (let i = 0; i < 3000; i++) seen.add(generateQuestion({}).prompt);
  assert.ok(seen.size > 25, `expected many distinct questions, got ${seen.size}`);
  assert.ok(approxVariety() > 300, `expected a healthy ceiling, got ${approxVariety()}`);
});

test('categories span the full human range', () => {
  const cats = new Set();
  for (let i = 0; i < 2000; i++) cats.add(generateQuestion({}).category);
  for (const c of ['morality', 'love', 'mortality', 'desire', 'truth', 'existential', 'self']) {
    assert.ok(cats.has(c), `expected to see category ${c}`);
  }
});
